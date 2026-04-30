import Link from "next/link";
import { getTradesDashboardData } from "@/actions/trades";
import { requireTradesDashboardUser } from "@/lib/trades-access";
import { hasProEntitlement } from "@/lib/entitlements";
import { getSearchUsageState } from "@/lib/search-usage";

const money = (c: number) =>
  (c / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });

export default async function TradesHomePage() {
  const u = await requireTradesDashboardUser();
  const [data, searchUsage] = await Promise.all([
    getTradesDashboardData(),
    getSearchUsageState(u),
  ]);
  const isPro = hasProEntitlement(u);
  const searchLimit = searchUsage.limit;

  return (
    <div className="w-full min-w-0 max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
          Field &amp; service
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Trades dashboard
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Simple metrics for a busy day — same tools work great on your phone in the
          field.
        </p>
        <p className="mt-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          Google business searches:{" "}
          <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {searchUsage.used} / {searchLimit}
          </span>{" "}
          used {searchUsage.mode === "lifetime" ? "total" : "today"}
          {isPro ? " (Pro plan)" : " (Starter; upgrade for more)"}. Cached repeat searches do not add to this
          count.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-white p-5 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-slate-900/50">
          <p className="text-sm font-medium text-amber-900/90 dark:text-amber-200">
            Jobs this week
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {data.jobsThisWeekCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800/80 dark:bg-slate-900/60">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Revenue this month
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {money(data.revenueThisMonthCents)}
          </p>
        </div>
        <div className="sm:col-span-2 rounded-2xl border border-rose-200/60 bg-rose-50/80 p-5 dark:border-rose-900/40 dark:bg-rose-950/20">
          <p className="text-sm font-medium text-rose-900/90 dark:text-rose-200">
            Pending payment
          </p>
          {data.pendingPayment.length === 0 ? (
            <p className="mt-1 text-slate-600 dark:text-slate-400">You&apos;re all paid up (for listed jobs).</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.pendingPayment.map((j) => (
                <li
                  key={j.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/90 px-3 py-2 text-sm dark:bg-slate-900/50"
                >
                  <span className="min-w-0">
                    {j.customer.name} — {j.jobType}
                  </span>
                  <span className="font-medium tabular-nums">
                    {money(j.priceCents)}
                  </span>
                  <Link
                    className="text-amber-800 underline decoration-amber-500/50 dark:text-amber-300"
                    href={`/dashboard/trades/jobs/${j.id}/invoice`}
                  >
                    Invoice
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/dashboard/trades/calls"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-amber-600 px-5 text-sm font-semibold text-white shadow touch-manipulation hover:bg-amber-500"
        >
          Calls &amp; leads
        </Link>
        <Link
          href="/dashboard/trades/schedule"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-amber-300/80 bg-white px-5 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"
        >
          Job schedule
        </Link>
        <Link
          href="/dashboard/trades/customers"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-200/80 bg-white px-5 text-sm font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          Customer history
        </Link>
        <Link
          href="/dashboard/search"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-200/80 px-5 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300"
        >
          Find businesses
        </Link>
        <Link
          href="/dashboard/leads"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-indigo-200/80 bg-indigo-50/80 px-5 text-sm font-medium text-indigo-900 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-100"
        >
          CRM Leads
        </Link>
      </div>
    </div>
  );
}
