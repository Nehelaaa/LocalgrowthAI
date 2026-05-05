"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

const ROW_OPTIONS = [
  { value: "15", label: "15" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
  { value: "all", label: "Show all" },
] as const;

function buildHref(
  sp: URLSearchParams,
  patch: Record<string, string | undefined>,
): string {
  const next = new URLSearchParams(sp.toString());
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === "") next.delete(k);
    else next.set(k, v);
  }
  const q = next.toString();
  return q ? `/dashboard/leads?${q}` : "/dashboard/leads";
}

type Props = {
  total: number;
  page: number;
  perPage: number | "all";
  totalPages: number;
  truncated: boolean;
};

function PagerChrome({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-indigo-50/[0.35] shadow-sm ring-1 ring-indigo-500/[0.04] dark:border-slate-700/90 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 dark:ring-indigo-500/10">
      {children}
    </div>
  );
}

export function LeadsPagination({ total, page, perPage, totalPages, truncated }: Props) {
  const sp = useSearchParams();
  const router = useRouter();

  const perStr = perPage === "all" ? "all" : String(perPage);
  const from =
    total === 0 ? 0 : perPage === "all" ? 1 : Math.min(total, (page - 1) * perPage + 1);
  const to = total === 0 ? 0 : perPage === "all" ? total : Math.min(total, page * perPage);

  if (total === 0 && !truncated) {
    return null;
  }

  return (
    <>
      <PagerChrome>
        <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:py-4">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              <span className="tabular-nums">
                {from === 0 && to === 0 ? (
                  <>No matching leads</>
                ) : perPage === "all" ? (
                  <>
                    Showing all <strong className="text-indigo-600 dark:text-indigo-300">{total}</strong> leads
                  </>
                ) : (
                  <>
                    Showing{" "}
                    <strong className="text-indigo-600 dark:text-indigo-300">
                      {from}–{to}
                    </strong>{" "}
                    of <strong className="text-slate-800 dark:text-slate-100">{total}</strong> filtered
                  </>
                )}
              </span>
            </p>
            {!truncated ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rows per page adapts pagination; sorting still prioritizes working leads first.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="whitespace-nowrap">Rows</span>
              <select
                value={perStr}
                onChange={(e) => {
                  const v = e.target.value;
                  const href =
                    v === "all"
                      ? buildHref(sp, { perPage: "all", page: undefined })
                      : buildHref(sp, { perPage: v, page: undefined });
                  router.push(href);
                }}
                className="h-10 min-w-[8.5rem] cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-indigo-500/40"
              >
                {ROW_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                    {o.value !== "all" ? " / page" : ""}
                  </option>
                ))}
              </select>
            </label>

            {perPage !== "all" && totalPages > 1 ? (
              <div className="flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white/90 p-1 shadow-inner dark:border-slate-600 dark:bg-slate-800/80">
                {page <= 1 ? (
                  <span
                    aria-hidden
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-sm font-semibold text-slate-300 dark:text-slate-600"
                  >
                    ‹
                  </span>
                ) : (
                  <Link
                    href={buildHref(sp, { page: page === 2 ? undefined : String(page - 1) })}
                    prefetch={false}
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-800 dark:text-slate-200 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-200"
                    aria-label="Previous page"
                  >
                    ‹
                  </Link>
                )}
                <span className="min-w-[5.5rem] px-2 text-center text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                  {page} / {totalPages}
                </span>
                {page >= totalPages ? (
                  <span
                    aria-hidden
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-sm font-semibold text-slate-300 dark:text-slate-600"
                  >
                    ›
                  </span>
                ) : (
                  <Link
                    href={buildHref(sp, { page: String(page + 1) })}
                    prefetch={false}
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-800 dark:text-slate-200 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-200"
                    aria-label="Next page"
                  >
                    ›
                  </Link>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {truncated ? (
          <div className="border-t border-amber-200/80 bg-amber-50/90 px-4 py-2.5 text-xs font-medium text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100">
            Results capped at the first {total.toLocaleString()} matches (API limit). Narrow filters to find
            specific leads faster.
          </div>
        ) : null}
      </PagerChrome>

    </>
  );
}

/** Bottom bar: quick page jump + duplicate controls for long scroll. */
export function LeadsPaginationFooter(props: Props) {
  const sp = useSearchParams();
  const { page, totalPages, total, perPage, truncated } = props;

  if (total === 0) return null;
  if (perPage === "all") return null;
  if (totalPages <= 1) return null;
  const from = Math.min(total, (page - 1) * perPage + 1);
  const to = Math.min(total, page * perPage);

  return (
    <nav
      className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
      aria-label="Leads pagination footer"
    >
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-center text-xs text-slate-600 dark:text-slate-400 sm:text-left">
          <span className="tabular-nums font-medium text-slate-800 dark:text-slate-200">
            {from}–{to}
          </span>
          <span className="text-slate-500"> of </span>
          <span className="font-medium text-slate-800 dark:text-slate-200">{total}</span>
          {truncated ? <span className="block text-[11px] text-amber-800 dark:text-amber-200">(list truncated)</span> : null}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {page <= 1 ? (
            <span className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 dark:text-slate-600">
              Previous page
            </span>
          ) : (
            <Link
              href={buildHref(sp, { page: page === 2 ? undefined : String(page - 1) })}
              prefetch={false}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-200 hover:bg-indigo-50 dark:bg-slate-800 dark:text-indigo-300 dark:ring-indigo-500/30 dark:hover:bg-indigo-950/40"
            >
              Previous page
            </Link>
          )}
          {page >= totalPages ? (
            <span className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 dark:text-slate-600">
              Next page
            </span>
          ) : (
            <Link
              href={buildHref(sp, { page: String(page + 1) })}
              prefetch={false}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Next page
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
