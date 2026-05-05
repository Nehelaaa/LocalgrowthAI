"use client";

import { useState } from "react";

export function ExportActions({
  totalLeads,
  canExport,
  triggerClassName = "",
}: {
  totalLeads: number;
  canExport: boolean;
  triggerClassName?: string;
}) {
  const [loading, setLoading] = useState(false);

  const downloadCsv = async () => {
    if (!canExport) {
      window.location.href = "/dashboard/plan";
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/export/csv");
      if (res.status === 403) {
        window.location.href = "/dashboard/plan";
        return;
      }
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `localleadster-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void downloadCsv()}
      disabled={loading || totalLeads === 0}
      title={!canExport ? "Upgrade to Pro to export CSV" : undefined}
      className={
        "inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/80 hover:text-violet-900 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-violet-500/40 dark:hover:bg-violet-950/30 dark:hover:text-white " +
        triggerClassName
      }
    >
      {loading ? "Exporting…" : "Export"}
    </button>
  );
}
