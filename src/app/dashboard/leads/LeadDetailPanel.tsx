"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ContactStatusPicker } from "@/components/ContactStatusPicker";
import { DeleteLeadDialog } from "@/components/DeleteLeadDialog";
import { updateLeadStatus, updateLead, deleteLead } from "@/actions/leads";
import { InvoiceBuilderModal } from "@/components/invoices/InvoiceBuilderModal";
import { getLeadById } from "@/actions/leads-list";
import { generateDemoPage } from "@/actions/demo";
import {
  resolveGoogleMapsDirectionsUrl,
  resolveGoogleMapsListingUrl,
} from "@/lib/google-maps-links";
import { formatBusinessLocation } from "@/lib/format-business-location";
import type { Lead, Business } from "@prisma/client";

type LeadWithRelations = Lead & { business: Business };

export type LeadDetailPanelPatch = Partial<
  Pick<
    Lead,
    | "contactStatus"
    | "notes"
    | "followUpDate"
    | "websiteQuote"
    | "pocName"
    | "pocPhone"
    | "pocEmail"
    | "invoiceDraft"
  >
>;

export function LeadDetailPanel({
  leadId,
  initialLead,
  onClose,
  onLeadUpdated,
  onLeadRemoved,
}: {
  leadId: string;
  initialLead?: LeadWithRelations;
  onClose: () => void;
  onLeadUpdated?: (leadId: string, patch: LeadDetailPanelPatch) => void;
  onLeadRemoved?: (leadId: string) => void;
}) {
  const [lead, setLead] = useState<LeadWithRelations | null>(initialLead ?? null);
  const [loading, setLoading] = useState(!initialLead);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [websiteQuote, setWebsiteQuote] = useState("");
  const [pocName, setPocName] = useState("");
  const [pocPhone, setPocPhone] = useState("");
  const [pocEmail, setPocEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [demoGenerating, setDemoGenerating] = useState(false);
  const [demoStatus, setDemoStatus] = useState<string | null>(null);

  useEffect(() => {
    if (initialLead?.id === leadId) {
      setLead(initialLead);
      setNotes(initialLead.notes ?? "");
      setWebsiteQuote(initialLead.websiteQuote ?? "");
      setPocName(initialLead.pocName ?? "");
      setPocPhone(initialLead.pocPhone ?? "");
      setPocEmail(initialLead.pocEmail ?? "");
      setFollowUpDate(
        initialLead.followUpDate
          ? new Date(initialLead.followUpDate).toISOString().slice(0, 10)
          : ""
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    getLeadById(leadId)
      .then((l) => {
        setLead(l);
        if (l) {
          setNotes(l.notes ?? "");
          setWebsiteQuote(l.websiteQuote ?? "");
          setPocName(l.pocName ?? "");
          setPocPhone(l.pocPhone ?? "");
          setPocEmail(l.pocEmail ?? "");
          setFollowUpDate(
            l.followUpDate ? new Date(l.followUpDate).toISOString().slice(0, 10) : ""
          );
        }
      })
      .finally(() => setLoading(false));
  }, [leadId, initialLead]);

  const applyLeadPatch = useCallback(
    (patch: LeadDetailPanelPatch) => {
      setLead((current) => (current ? { ...current, ...patch } : current));
      onLeadUpdated?.(leadId, patch);
    },
    [leadId, onLeadUpdated]
  );

  const persistLeadFields = useCallback(
    (opts?: { silent?: boolean }) => {
      const followUp =
        followUpDate.trim() === "" ? null : new Date(`${followUpDate}T12:00:00.000Z`);
      return updateLead({
        leadId,
        notes: notes || undefined,
        followUpDate: followUpDate.trim() === "" ? null : followUpDate,
        websiteQuote,
        pocName,
        pocPhone,
        pocEmail,
        silent: opts?.silent ?? true,
      }).then(() => {
        applyLeadPatch({
          notes: notes || null,
          followUpDate: followUp,
          websiteQuote: websiteQuote.trim() || null,
          pocName: pocName.trim() || null,
          pocPhone: pocPhone.trim() || null,
          pocEmail: pocEmail.trim() || null,
        });
      });
    },
    [
      leadId,
      notes,
      followUpDate,
      websiteQuote,
      pocName,
      pocPhone,
      pocEmail,
      applyLeadPatch,
    ]
  );

  const handleSave = useCallback(async () => {
    setSaveError(null);
    setSaving(true);
    try {
      await persistLeadFields({ silent: false });
      onClose();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : "Could not save changes.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }, [persistLeadFields, onClose]);

  /** Auto-save price + point of contact shortly after you stop typing. */
  useEffect(() => {
    if (!lead) return;
    const savedQuote = lead.websiteQuote ?? "";
    const savedPocName = lead.pocName ?? "";
    const savedPocPhone = lead.pocPhone ?? "";
    const savedPocEmail = lead.pocEmail ?? "";
    const dirty =
      websiteQuote !== savedQuote ||
      pocName !== savedPocName ||
      pocPhone !== savedPocPhone ||
      pocEmail !== savedPocEmail;
    if (!dirty) return;
    const t = window.setTimeout(() => {
      void persistLeadFields();
    }, 650);
    return () => window.clearTimeout(t);
  }, [
    websiteQuote,
    pocName,
    pocPhone,
    pocEmail,
    lead,
    persistLeadFields,
  ]);

  if (loading || !lead) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-[1px] md:items-center md:justify-center"
        role="alertdialog"
        aria-busy
        aria-label="Loading lead"
      >
        <div className="rounded-xl border border-slate-200 bg-white px-8 py-6 text-sm font-medium text-slate-600 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Loading…
        </div>
      </div>
    );
  }

  const confirmRemoveFromPanel = async () => {
    setDeleteSubmitting(true);
    try {
      await deleteLead(leadId);
      setDeleteDialogOpen(false);
      onLeadRemoved?.(leadId);
      onClose();
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : "Could not remove this lead."
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const biz = lead.business;
  const locationLabel = formatBusinessLocation({
    city: biz.city,
    state: biz.state,
    address: biz.address,
  });
  const mapsListing = resolveGoogleMapsListingUrl({
    placeId: biz.placeId,
    name: biz.name,
    address: biz.address,
    city: biz.city,
    state: biz.state,
    lat: biz.lat,
    lng: biz.lng,
    googleMapsUrl: biz.googleMapsUrl,
  });
  const mapsDirections = resolveGoogleMapsDirectionsUrl({
    placeId: biz.placeId,
    name: biz.name,
    address: biz.address,
    city: biz.city,
    state: biz.state,
    lat: biz.lat,
    lng: biz.lng,
  });

  const handleGenerateWebsite = async () => {
    setDemoGenerating(true);
    setDemoStatus(null);
    try {
      const result = await generateDemoPage(leadId);
      setDemoStatus(
        result.templateName
          ? `Opened ${result.nicheLabel} mockup (${result.templateName})`
          : "Website mockup opened in a new tab"
      );
      window.open(`/demo/${result.slug}`, "_blank", "noopener,noreferrer");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not generate website mockup.";
      if (msg === "PRO_REQUIRED") {
        setDemoStatus("Upgrade to Pro to generate website mockups.");
      } else {
        setDemoStatus(msg);
      }
    } finally {
      setDemoGenerating(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-stretch justify-center bg-slate-900/50 backdrop-blur-[1px] sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleteDialogOpen) onClose();
      }}
    >
      <DeleteLeadDialog
        open={deleteDialogOpen}
        businessName={lead.business.name}
        loading={deleteSubmitting}
        onCancel={() => !deleteSubmitting && setDeleteDialogOpen(false)}
        onConfirm={() => void confirmRemoveFromPanel()}
      />

      <InvoiceBuilderModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        leadId={lead.id}
        savedInvoiceDraft={lead.invoiceDraft}
        onInvoiceDraftSaved={(draft) => {
          applyLeadPatch({ invoiceDraft: draft });
        }}
        initialClientName={lead.business.name}
        initialClientAddress={lead.business.address ?? ""}
        initialWebsitePriceText={websiteQuote}
        initialInvoiceNotes=""
      />

      <div
        className="relative z-[111] box-border flex h-full max-h-[100dvh] w-full min-h-0 min-w-0 max-w-2xl flex-col overflow-hidden rounded-none border-0 border-slate-200 bg-white shadow-2xl sm:max-h-[min(90vh,900px)] sm:rounded-2xl sm:border dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 overflow-x-hidden border-b border-slate-200 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6 sm:pb-4 sm:pt-6 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 inline-flex h-11 min-h-[44px] w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:right-6 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex min-w-0 flex-col gap-3 pt-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:pr-12 sm:pt-0">
            <div className="min-w-0 w-full max-w-full pr-14 sm:flex-1 sm:pr-3 sm:pt-0">
              <h2 className="break-words text-lg font-bold leading-snug text-slate-900 sm:text-xl dark:text-white">
                {lead.business.name}
              </h2>
              <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
                {locationLabel} · Score {lead.leadScore} · {lead.badge}
              </p>
            </div>
            <div className="flex w-full min-w-0 max-w-full flex-col gap-2 sm:w-auto sm:max-w-[min(100%,24rem)] sm:flex-none sm:flex-row sm:flex-wrap sm:justify-end sm:gap-2">
              <button
                type="button"
                onClick={() => setInvoiceOpen(true)}
                className="inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-800 shadow-sm transition hover:bg-indigo-100 sm:w-auto sm:min-w-[10rem] dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-100 dark:hover:bg-indigo-900/50"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
                Generate invoice
              </button>
              <button
                type="button"
                onClick={() => void handleGenerateWebsite()}
                disabled={demoGenerating}
                className="inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-800 shadow-sm transition hover:bg-violet-100 disabled:opacity-60 sm:w-auto sm:min-w-[10rem] dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-100 dark:hover:bg-violet-900/50"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.732-3.553"
                  />
                </svg>
                {demoGenerating ? "Building…" : "Generate website"}
              </button>
              {demoStatus ? (
                <p className="w-full text-center text-xs text-violet-700 sm:text-right dark:text-violet-300">
                  {demoStatus}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleteSubmitting}
                className="inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 sm:w-auto sm:min-w-[8rem] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
                Remove
              </button>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6 space-y-6">
          {/* Contact info */}
          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Contact info
            </h3>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 text-sm space-y-2">
              {lead.business.phone ? (
                <p>
                  <span className="text-slate-500 dark:text-slate-400">Phone:</span>{" "}
                  <a
                    href={`tel:${lead.business.phone.replace(/\D/g, "")}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {lead.business.phone}
                  </a>
                </p>
              ) : (
                <p className="text-slate-500">Phone: —</p>
              )}
              {lead.business.website ? (
                <p>
                  <span className="text-slate-500 dark:text-slate-400">Website:</span>{" "}
                  <a
                    href={lead.business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                  >
                    {lead.business.website}
                  </a>
                </p>
              ) : (
                <p className="text-slate-500">Website: No website</p>
              )}
              {lead.business.address && (
                <p>
                  <span className="text-slate-500 dark:text-slate-400">Address:</span>{" "}
                  <span className="text-slate-700 dark:text-slate-300">
                    {lead.business.address}
                  </span>
                </p>
              )}
              {(mapsListing || mapsDirections) && (
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                  {mapsListing ? (
                    <a
                      href={mapsListing}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View on Maps →
                    </a>
                  ) : null}
                  {mapsDirections ? (
                    <a
                      href={mapsDirections}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Directions →
                    </a>
                  ) : null}
                </p>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Email is not provided by Google Places; look on their website or Maps listing, or add a contact below.
            </p>
          </section>

          <section>
            <h3 className="mb-0.5 font-semibold text-slate-900 dark:text-white">
              Point of contact
            </h3>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              Who you&apos;re working with at this business (optional). Saves like service price when you pause typing or leave a field.
            </p>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 md:gap-3">
              <div className="min-w-0">
                <label
                  htmlFor="lead-poc-name"
                  className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Name
                </label>
                <input
                  id="lead-poc-name"
                  type="text"
                  autoComplete="name"
                  value={pocName}
                  onChange={(e) => setPocName(e.target.value)}
                  placeholder="e.g. Jordan"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="min-w-0">
                <label
                  htmlFor="lead-poc-phone"
                  className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Number
                </label>
                <input
                  id="lead-poc-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={pocPhone}
                  onChange={(e) => setPocPhone(e.target.value)}
                  placeholder="Direct line or mobile"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="min-w-0">
                <label
                  htmlFor="lead-poc-email"
                  className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Email
                </label>
                <input
                  id="lead-poc-email"
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="email"
                  value={pocEmail}
                  onChange={(e) => setPocEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </section>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Contact status
            </label>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-500">
              Each stage has a color: neutral → in motion → hot → won / not interested.
            </p>
            <ContactStatusPicker
              variant="lead"
              value={lead.contactStatus}
              onChange={async (next) => {
                const prev = lead.contactStatus;
                applyLeadPatch({ contactStatus: next });
                try {
                  await updateLeadStatus(leadId, next, { silent: true });
                } catch (e) {
                  applyLeadPatch({ contactStatus: prev });
                  window.alert(
                    e instanceof Error ? e.message : "Could not update status."
                  );
                  return;
                }
                if (next === "CLOSED_LOST") {
                  onLeadRemoved?.(leadId);
                  onClose();
                }
              }}
            />
          </div>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              Service price
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              What you&apos;re charging this business for your service (any format
              you like). Saves automatically about a second after you stop typing,
              when you leave a field, or when you tap Save below.
            </p>
            <input
              type="text"
              inputMode="decimal"
              value={websiteQuote}
              onChange={(e) => setWebsiteQuote(e.target.value)}
              placeholder="e.g. 3500, $3,500, or $3.5k"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-white"
            />
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              rows={3}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-white"
            />
            <label className="block mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Follow-up date
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-white"
            />
          </section>
        </div>

        <div
          className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900 sm:px-6"
        >
          {saveError ? (
            <p className="mb-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {saveError}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex min-h-11 min-w-[7.5rem] touch-manipulation items-center justify-center rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
