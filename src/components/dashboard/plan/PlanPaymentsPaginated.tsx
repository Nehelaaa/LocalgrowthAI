"use client";

import { useMemo, useState } from "react";
import {
  formatInvoiceDate,
  formatMoneyMinor,
  paymentStatusBadgeClass,
} from "@/lib/billing-plan-format";
import type { SafePaymentActivityRow } from "@/lib/stripe-customer-billing";

const PAGE_SIZE = 10;

function PaginationFooter({
  page,
  totalPages,
  startIdx,
  endIdx,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  startIdx: number;
  endIdx: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
      <span>
        Showing{" "}
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {startIdx + 1}–{Math.min(endIdx, total)}
        </span>{" "}
        of <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span>
      </span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 0}
          className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-45 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Previous
        </button>
        <span className="tabular-nums text-slate-500 dark:text-slate-400">
          Page {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages - 1}
          className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-45 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Next
        </button>
      </span>
    </div>
  );
}

export function PlanPaymentsPaginated({ rows }: { rows: SafePaymentActivityRow[] }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageIndex = Math.min(Math.max(0, page), totalPages - 1);

  const slice = useMemo(() => {
    const startIdx = pageIndex * PAGE_SIZE;
    return { rows: rows.slice(startIdx, startIdx + PAGE_SIZE), startIdx };
  }, [rows, pageIndex]);

  if (rows.length === 0) {
    return (
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        No card charges returned from Stripe yet. If you just paid, refresh in a moment.
      </p>
    );
  }

  const { rows: pageRows, startIdx } = slice;
  const endIdxExclusive = startIdx + pageRows.length;

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/50">
            <tr>
              <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Date</th>
              <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Status</th>
              <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Charged</th>
              <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Refunded</th>
              <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Net</th>
              <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {pageRows.map((row) => (
              <tr key={row.id} className="bg-white dark:bg-slate-900">
                <td className="whitespace-nowrap px-3 py-2 text-slate-600 dark:text-slate-400">
                  {formatInvoiceDate(row.createdUnix)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold " +
                      paymentStatusBadgeClass(row.statusLabel)
                    }
                  >
                    {row.statusLabel}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-900 dark:text-white">
                  {formatMoneyMinor(row.amount, row.currency)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-700 dark:text-slate-300">
                  {row.amountRefunded > 0 ? formatMoneyMinor(row.amountRefunded, row.currency) : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-900 dark:text-white">
                  {formatMoneyMinor(row.netAfterRefunds, row.currency)}
                </td>
                <td className="px-3 py-2 text-right">
                  {row.receiptUrl ? (
                    <a
                      href={row.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                    >
                      Receipt
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationFooter
        page={pageIndex}
        totalPages={totalPages}
        startIdx={startIdx}
        endIdx={endIdxExclusive}
        total={rows.length}
        onPrev={() =>
          setPage((p) => {
            const cur = Math.min(p, totalPages - 1);
            return Math.max(0, cur - 1);
          })
        }
        onNext={() =>
          setPage((p) => {
            const cur = Math.min(p, totalPages - 1);
            return Math.min(totalPages - 1, cur + 1);
          })
        }
      />
    </div>
  );
}
