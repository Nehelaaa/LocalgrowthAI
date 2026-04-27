"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LeadDetailPanel } from "./LeadDetailPanel";
import { deleteLead } from "@/actions/leads";
import {
  DeleteLeadDialog,
  TrashIconButton,
} from "@/components/DeleteLeadDialog";
import { contactStatusLabel, contactStatusPillClass } from "@/lib/contact-status";
import type { Lead, Business, LeadBadge } from "@prisma/client";

type LeadWithBusiness = Lead & { business: Business };

const BADGE_COLORS: Record<LeadBadge, string> = {
  HOT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  WARM: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  COLD: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

export function LeadsTable({ leads }: { leads: LeadWithBusiness[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    leadId: string;
    name: string;
  } | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

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
      await deleteLead(deleteTarget.leadId);
      const removedId = deleteTarget.leadId;
      setDeleteTarget(null);
      setSelectedId((id) => (id === removedId ? null : id));
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      console.error(e);
      window.alert(
        e instanceof Error ? e.message : "Could not remove this lead."
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center text-slate-500">
        No leads yet. Use “Find businesses” to search and add leads.
      </div>
    );
  }

  const actionsLocked = deleteSubmitting || deleteTarget !== null;

  const rowActions = (lead: LeadWithBusiness) => (
    <div className="flex items-center justify-end gap-2 sm:justify-end">
      <button
        type="button"
        onClick={() => setSelectedId(lead.id)}
        disabled={actionsLocked}
        className="inline-flex min-h-[44px] min-w-[88px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:bg-indigo-100 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-900/50 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300 touch-manipulation"
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

      <div className="md:hidden space-y-3" role="list" aria-label="Leads list">
        {leads.map((lead) => (
          <div
            key={lead.id}
            role="listitem"
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 min-w-0">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {lead.business.name}
                </p>
                <p className="text-sm text-slate-500">
                  {lead.business.city}, {lead.business.state}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Score</p>
                  <p className="font-mono text-slate-800 dark:text-slate-200">
                    {lead.leadScore}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Badge</p>
                  <span
                    className={`mt-0.5 inline-block rounded px-2 py-0.5 text-xs font-medium ${BADGE_COLORS[lead.badge]}`}
                  >
                    {lead.badge}
                  </span>
                </div>
                <div className="col-span-2 min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                  <span
                    className={`mt-1 inline-flex min-h-[1.75rem] max-w-full items-center whitespace-nowrap rounded-full px-3 py-1 text-left text-xs font-medium ${contactStatusPillClass[lead.contactStatus]}`}
                  >
                    {contactStatusLabel[lead.contactStatus]}
                  </span>
                </div>
                <div className="col-span-2 min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Website price</p>
                  <p
                    className="mt-0.5 truncate text-slate-600 dark:text-slate-300"
                    title={lead.websiteQuote ?? undefined}
                  >
                    {lead.websiteQuote ?? "—"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Follow-up</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {lead.followUpDate
                      ? new Date(lead.followUpDate).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>
              {rowActions(lead)}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
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
                  Website price
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
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {lead.business.name}
                      </p>
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
                    {rowActions(lead)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedId && (
        <LeadDetailPanel
          leadId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
