"use client";

import { useMemo, useState } from "react";
import { formatInvoiceDate, formatMoneyMinor, invoiceDownloadHref } from "@/lib/billing-plan-format";
import type { SafeInvoiceRow } from "@/lib/stripe-customer-billing";

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

export function PlanInvoicesPaginated({ invoices }: { invoices: SafeInvoiceRow[] }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));
  const pageIndex = Math.min(Math.max(0, page), totalPages - 1);

  const slice = useMemo(() => {
    const startIdx = pageIndex * PAGE_SIZE;
    return { rows: invoices.slice(startIdx, startIdx + PAGE_SIZE), startIdx };
  }, [invoices, pageIndex]);
  const { rows: pageRows, startIdx } = slice;
  const endIdxExclusive = startIdx + pageRows.length;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/50">
            <tr>
              <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Date</th>
              <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Invoice</th>
              <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Amount</th>
              <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {pageRows.map((inv) => {
              const href = invoiceDownloadHref(inv);
              return (
                <tr key={inv.id} className="bg-white dark:bg-slate-900">
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600 dark:text-slate-400">
                    {formatInvoiceDate(inv.createdUnix)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {inv.number ?? `${inv.id.slice(0, 12)}…`}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-900 dark:text-white">
                    <span className="block">{formatMoneyMinor(inv.amountPaid, inv.currency)}</span>
                    {inv.postPaymentCreditNotesAmount > 0 ? (
                      <span className="mt-1 block text-xs font-medium text-amber-800 dark:text-amber-200">
                        Credit note{" "}
                        {formatMoneyMinor(inv.postPaymentCreditNotesAmount, inv.currency)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                      >
                        PDF
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <PaginationFooter
        page={pageIndex}
        totalPages={totalPages}
        startIdx={startIdx}
        endIdx={endIdxExclusive}
        total={invoices.length}
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
