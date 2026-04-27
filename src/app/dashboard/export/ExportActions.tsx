"use client";

import { useState } from "react";
import Link from "next/link";

export function ExportActions({
  totalLeads,
  canExport,
}: {
  totalLeads: number;
  canExport: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const downloadCsv = async () => {
    if (!canExport) {
      window.location.href = "/#pricing";
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/export/csv");
      if (res.status === 403) {
        window.location.href = "/#pricing";
        return;
      }
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `localgrowth-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {!canExport && (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
          Export is a Pro feature. Open <strong>Upgrade to Pro</strong> in the sidebar, or go to
          the{" "}
          <Link className="font-medium text-indigo-600 underline dark:text-indigo-400" href="/#pricing">
            pricing
          </Link>{" "}
          section.
        </p>
      )}
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={downloadCsv}
          disabled={loading || totalLeads === 0 || !canExport}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Preparing…" : "Download CSV"}
        </button>
      </div>
    </div>
  );
}
