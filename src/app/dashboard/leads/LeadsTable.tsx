"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { LeadDetailPanel, type LeadDetailPanelPatch } from "./LeadDetailPanel";
import { apiDeleteLead } from "@/lib/lead-api-client";
import {
  DeleteLeadDialog,
  TrashIconButton,
} from "@/components/DeleteLeadDialog";
import { contactStatusLabel, contactStatusPillClass } from "@/lib/contact-status";
import { resolveGoogleMapsListingUrl } from "@/lib/google-maps-links";
import type { Lead, Business, LeadBadge } from "@prisma/client";

type LeadWithBusiness = Lead & { business: Business };

function googleMapsUrlForBusiness(b: Business): string | null {
  return resolveGoogleMapsListingUrl({
    placeId: b.placeId,
    name: b.name,
    address: b.address,
    city: b.city,
    state: b.state,
    lat: b.lat,
    lng: b.lng,
    googleMapsUrl: b.googleMapsUrl,
  });
}

const BADGE_COLORS: Record<LeadBadge, string> = {
  HOT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  WARM: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  COLD: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

export function LeadsTable({
  leads,
  isPro = false,
}: {
  leads: LeadWithBusiness[];
  isPro?: boolean;
}) {
  const [localLeads, setLocalLeads] = useState(leads);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    leadId: string;
    name: string;
  } | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  const leadsWithMaps = useMemo(
    () =>
      localLeads.map((lead) => ({
        lead,
        mapsUrl: googleMapsUrlForBusiness(lead.business),
      })),
    [localLeads]
  );

  const patchLeadInList = useCallback((leadId: string, patch: LeadDetailPanelPatch) => {
    setLocalLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, ...patch } : l))
    );
  }, []);

  const removeLeadFromList = useCallback((leadId: string) => {
    setLocalLeads((prev) => prev.filter((l) => l.id !== leadId));
    setSelectedId((id) => (id === leadId ? null : id));
  }, []);

  const selectedLead = useMemo(
    () => localLeads.find((l) => l.id === selectedId),
    [localLeads, selectedId]
  );

  useEffect(() => {
    if (!deleteTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleteSubmitting) setDeleteTarget(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteTarget, deleteSubmitting]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      await apiDeleteLead(deleteTarget.leadId);
      const removedId = deleteTarget.leadId;
      setDeleteTarget(null);
      removeLeadFromList(removedId);
    } catch (e) {
      console.error(e);
      window.alert(
        e instanceof Error ? e.message : "Could not remove this lead."
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (localLeads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200/90 bg-white/80 px-6 py-14 text-center dark:border-slate-700/80 dark:bg-slate-900/70">
        <p className="text-base font-medium text-slate-700 dark:text-slate-200">No leads yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Use <span className="font-medium text-violet-700 dark:text-violet-300">Find businesses</span> to search,
          or add one manually.
        </p>
      </div>
    );
  }

  const actionsLocked = deleteSubmitting || deleteTarget !== null;

  const rowActions = (lead: LeadWithBusiness, layout: "mobile" | "desktop") => (
    <div
      className={
        layout === "mobile"
          ? "flex items-stretch gap-2 pt-1"
          : "flex items-center justify-end gap-2 sm:justify-end"
      }
    >
      <button
        type="button"
        onClick={() => setSelectedId(lead.id)}
        disabled={actionsLocked}
        className={
          layout === "mobile"
            ? "inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-500/15 transition hover:from-violet-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-40 dark:shadow-indigo-900/25 touch-manipulation"
            : "inline-flex min-h-[44px] min-w-[88px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:bg-indigo-100 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-900/50 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300 touch-manipulation"
        }
      >
        Details
      </button>
      <TrashIconButton
        onClick={() =>
          setDeleteTarget({
            leadId: lead.id,
            name: lead.business.name,
          })
        }
        disabled={actionsLocked}
        label={`Remove ${lead.business.name} from leads`}
        className={
          layout === "mobile"
            ? "min-h-[48px] min-w-[48px] shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800"
            : undefined
        }
      />
    </div>
  );

  return (
    <>
      <DeleteLeadDialog
        open={deleteTarget !== null}
        businessName={deleteTarget?.name ?? ""}
        loading={deleteSubmitting}
        onCancel={() => !deleteSubmitting && setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

      <div className="lg:hidden space-y-3" role="list" aria-label="Leads list">
        {leadsWithMaps.map(({ lead, mapsUrl }) => (
          <div
            key={lead.id}
            role="listitem"
            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700/80 dark:bg-slate-900/90 dark:ring-white/[0.05]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-violet-50/80 to-white px-4 py-3.5 dark:border-slate-800 dark:from-violet-950/25 dark:to-slate-900/80">
              <div className="min-w-0 flex-1">
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-semibold leading-snug text-slate-900 hover:text-violet-700 dark:text-white dark:hover:text-violet-300"
                    title="Open Google listing"
                  >
                    {lead.business.name}
                  </a>
                ) : (
                  <p className="font-semibold leading-snug text-slate-900 dark:text-white">
                    {lead.business.name}
                  </p>
                )}
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {[lead.business.city, lead.business.state].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
              <div
                className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-white shadow-inner shadow-slate-900/5 ring-1 ring-violet-200/60 dark:bg-slate-800 dark:ring-violet-500/20"
                aria-label={`Score ${lead.leadScore}`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Score
                </span>
                <span className="text-lg font-bold tabular-nums leading-none text-violet-700 dark:text-violet-300">
                  {lead.leadScore}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 px-4 pb-3 pt-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_COLORS[lead.badge]}`}
              >
                {lead.badge}
              </span>
              <span
                className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-medium ${contactStatusPillClass[lead.contactStatus]}`}
              >
                {contactStatusLabel[lead.contactStatus]}
              </span>
            </div>

            <div className="mx-4 mb-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/90 p-3 dark:bg-slate-800/50">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Service price
                </p>
                <p
                  className="mt-0.5 truncate text-sm font-medium text-slate-800 dark:text-slate-100"
                  title={lead.websiteQuote ?? undefined}
                >
                  {lead.websiteQuote ?? "—"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Follow-up
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100">
                  {lead.followUpDate
                    ? new Date(lead.followUpDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
              {rowActions(lead, "mobile")}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto -mx-0">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Business
                </th>
                <th className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Score
                </th>
                <th className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Badge
                </th>
                <th className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Service price
                </th>
                <th className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Follow-up
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {leadsWithMaps.map(({ lead, mapsUrl }) => (
                <tr
                  key={lead.id}
                  className="border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3">
                    <div>
                      {mapsUrl ? (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-slate-900 hover:text-indigo-700 hover:underline dark:text-white dark:hover:text-indigo-300"
                          title="Open Google listing"
                        >
                          {lead.business.name}
                        </a>
                      ) : (
                        <p className="font-medium text-slate-900 dark:text-white">
                          {lead.business.name}
                        </p>
                      )}
                      <p className="text-sm text-slate-500">
                        {lead.business.city}, {lead.business.state}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                    {lead.leadScore}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${BADGE_COLORS[lead.badge]}`}
                    >
                      {lead.badge}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex min-h-[1.75rem] max-w-full items-center whitespace-nowrap rounded-full px-3 py-1 text-left text-xs font-medium ${contactStatusPillClass[lead.contactStatus]}`}
                    >
                      {contactStatusLabel[lead.contactStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-[140px] truncate" title={lead.websiteQuote ?? undefined}>
                    {lead.websiteQuote ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {lead.followUpDate
                      ? new Date(lead.followUpDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {rowActions(lead, "desktop")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedId && selectedLead ? (
        <LeadDetailPanel
          isPro={isPro}
          leadId={selectedId}
          initialLead={selectedLead}
          onClose={() => setSelectedId(null)}
          onLeadUpdated={patchLeadInList}
          onLeadRemoved={removeLeadFromList}
        />
      ) : null}
    </>
  );
}
