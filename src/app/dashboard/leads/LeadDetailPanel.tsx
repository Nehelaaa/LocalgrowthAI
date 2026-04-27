"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ContactStatusPicker } from "@/components/ContactStatusPicker";
import { DeleteLeadDialog } from "@/components/DeleteLeadDialog";
import {
  updateLeadStatus,
  updateLead,
  generateOpportunityForLead,
  generateOutreachForLead,
  deleteLead,
} from "@/actions/leads";
import { generateDemoPage } from "@/actions/demo";
import { getLeadById } from "@/actions/leads-list";
import type { Lead, Business, Outreach, DemoPage } from "@prisma/client";

function proOrThrow(e: unknown, feature: string) {
  const m = e instanceof Error ? e.message : String(e);
  if (m === "PRO_REQUIRED") {
    window.alert(
      `Upgrade to Pro for ${feature}. Use "Upgrade to Pro" in the sidebar or open Pricing from the marketing site.`
    );
    return;
  }
  window.alert(m || "Something went wrong");
}

type LeadWithRelations = Lead & {
  business: Business;
  outreachs: Outreach[];
  demoPages: DemoPage[];
};

export function LeadDetailPanel({
  leadId,
  onClose,
}: {
  leadId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [lead, setLead] = useState<LeadWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [opportunityLoading, setOpportunityLoading] = useState(false);
  const [outreachLoading, setOutreachLoading] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [outreachContent, setOutreachContent] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [websiteQuote, setWebsiteQuote] = useState("");

  useEffect(() => {
    getLeadById(leadId).then((l) => {
      setLead(l);
      if (l) {
        setNotes(l.notes ?? "");
        setWebsiteQuote(l.websiteQuote ?? "");
        setFollowUpDate(
          l.followUpDate ? new Date(l.followUpDate).toISOString().slice(0, 10) : ""
        );
      }
    }).finally(() => setLoading(false));
  }, [leadId]);

  const refreshLead = useCallback(() => {
    getLeadById(leadId).then(setLead);
  }, [leadId]);

  const persistLeadFields = useCallback(() => {
    return updateLead({
      leadId,
      notes: notes || undefined,
      followUpDate: followUpDate
        ? new Date(followUpDate).toISOString()
        : null,
      websiteQuote,
    }).then(refreshLead);
  }, [leadId, notes, followUpDate, websiteQuote, refreshLead]);

  /** Auto-save price (and other fields) shortly after you stop typing. */
  useEffect(() => {
    if (!lead) return;
    const saved = lead.websiteQuote ?? "";
    if (websiteQuote === saved) return;
    const t = window.setTimeout(() => {
      void persistLeadFields();
    }, 650);
    return () => window.clearTimeout(t);
  }, [websiteQuote, lead, persistLeadFields]);

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

  const runOpportunity = async () => {
    setOpportunityLoading(true);
    try {
      await generateOpportunityForLead(leadId);
      refreshLead();
    } catch (e) {
      proOrThrow(e, "pro AI insights");
    } finally {
      setOpportunityLoading(false);
    }
  };

  const runOutreach = async (
    type: "email" | "call_script" | "instagram_dm" | "loom_script"
  ) => {
    setOutreachLoading(type);
    try {
      const { content } = await generateOutreachForLead(leadId, type);
      setOutreachContent((c) => ({ ...c, [type]: content }));
      refreshLead();
    } catch (e) {
      proOrThrow(e, "outreach");
    } finally {
      setOutreachLoading(null);
    }
  };

  const runDemo = async () => {
    setDemoLoading(true);
    try {
      const { slug } = await generateDemoPage(leadId);
      window.open(`/demo/${slug}`, "_blank");
      refreshLead();
    } catch (e) {
      proOrThrow(e, "client demo pages");
    } finally {
      setDemoLoading(false);
    }
  };

  const confirmRemoveFromPanel = async () => {
    setDeleteSubmitting(true);
    try {
      await deleteLead(leadId);
      setDeleteDialogOpen(false);
      onClose();
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : "Could not remove this lead."
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch justify-center bg-slate-900/50 backdrop-blur-[1px] sm:items-center sm:p-4"
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

      <div
        className="relative z-[101] flex h-full max-h-[100dvh] w-full min-h-0 max-w-2xl flex-col overflow-hidden rounded-none border-0 border-slate-200 bg-white shadow-2xl sm:max-h-[min(90vh,900px)] sm:rounded-2xl sm:border dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-200 p-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:gap-4 sm:p-6 sm:pt-6 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {lead.business.name}
            </h2>
            <p className="text-sm text-slate-500">
              {lead.business.city}, {lead.business.state} · Score {lead.leadScore}{" "}
              · {lead.badge}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleteSubmitting}
              className="inline-flex min-h-[44px] min-w-0 touch-manipulation items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <svg
                className="h-4 w-4"
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
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] touch-manipulation rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
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
              {lead.business.googleMapsUrl && (
                <p>
                  <a
                    href={lead.business.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Open in Google Maps →
                  </a>
                </p>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Email is not provided by Google Places; look on their website or Maps listing.
            </p>
          </section>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Contact status
            </label>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-500">
              Each stage has a color: neutral → in motion → hot → won / lost.
            </p>
            <ContactStatusPicker
              variant="lead"
              value={lead.contactStatus}
              onChange={async (next) => {
                await updateLeadStatus(leadId, next);
                refreshLead();
              }}
            />
          </div>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              Website price
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              What you&apos;re charging this business for the website (any format
              you like). Saves automatically about a second after you stop typing,
              or when you leave this field.
            </p>
            <input
              type="text"
              inputMode="decimal"
              value={websiteQuote}
              onChange={(e) => setWebsiteQuote(e.target.value)}
              onBlur={() => void persistLeadFields()}
              placeholder="e.g. 3500, $3,500, or $3.5k landing + blog"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-white"
            />
          </section>

          {/* Opportunity Insights */}
          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Opportunity insights
            </h3>
            {lead.opportunityInsights ? (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {lead.opportunityInsights}
              </div>
            ) : (
              <button
                type="button"
                onClick={runOpportunity}
                disabled={opportunityLoading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {opportunityLoading ? "Generating…" : "Generate with AI"}
              </button>
            )}
            {lead.revenueEstimate && (
              <p className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">
                {lead.revenueEstimate}
              </p>
            )}
          </section>

          {/* Outreach */}
          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Outreach
            </h3>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "email",
                  "call_script",
                  "instagram_dm",
                  "loom_script",
                ] as const
              ).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => runOutreach(type)}
                  disabled={outreachLoading !== null}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  {outreachLoading === type ? "…" : type.replace("_", " ")}
                </button>
              ))}
            </div>
            {(outreachContent.email ||
              outreachContent.call_script ||
              outreachContent.instagram_dm ||
              outreachContent.loom_script) && (
              <div className="mt-3 space-y-2">
                {Object.entries(outreachContent).map(
                  ([type, content]) =>
                    content && (
                      <div
                        key={type}
                        className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm whitespace-pre-wrap"
                      >
                        <span className="font-medium text-slate-600 dark:text-slate-400">
                          {type.replace("_", " ")}
                        </span>
                        <p className="mt-1 text-slate-700 dark:text-slate-300">
                          {content}
                        </p>
                      </div>
                    )
                )}
              </div>
            )}
          </section>

          {/* Demo */}
          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Demo page
            </h3>
            {lead.demoPages.length > 0 ? (
              <div className="flex gap-2">
                {lead.demoPages.map((d) => (
                  <a
                    key={d.id}
                    href={`/demo/${d.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline"
                  >
                    View demo
                  </a>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={runDemo}
                disabled={demoLoading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {demoLoading ? "Generating…" : "Generate demo"}
              </button>
            )}
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => void persistLeadFields()}
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
              onBlur={() => void persistLeadFields()}
              className="mt-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-white"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
