"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type HealthSeriesPoint = {
  day: string;
  searches: number;
  aiCalls: number;
  signups: number;
};

export type BillingFeedItem = {
  id: string;
  createdAt: string;
  severity: string;
  kind: string;
  title: string;
  userEmail: string | null;
};

type Metrics = {
  totalUsers: number;
  /** DB plan flags (grandfathered/comped included) — not Stripe MRR. */
  proEntitledAccounts: number;
  /** Live Stripe active subscription count. */
  payingSubscribers: number;
  freeUsers: number;
  pastDueUsers: number;
  searchesToday: number;
};

type Props = {
  series: HealthSeriesPoint[];
  billingEvents: BillingFeedItem[];
  metrics: Metrics;
};

function maxOf(nums: number[]) {
  return nums.reduce((m, v) => (v > m ? v : m), 0);
}

export function OwnerHealthDashboard({ series, billingEvents, metrics }: Props) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [billingFilter, setBillingFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [chartMode, setChartMode] = useState<"searches" | "ai" | "signups" | "all">("all");

  const filteredBilling = useMemo(() => {
    if (billingFilter === "all") return billingEvents;
    return billingEvents.filter((e) => e.severity === billingFilter);
  }, [billingEvents, billingFilter]);

  const chartMax = useMemo(() => {
    if (chartMode === "all") {
      return Math.max(
        1,
        maxOf(series.flatMap((s) => [s.searches, s.aiCalls, s.signups]))
      );
    }
    if (chartMode === "searches") return Math.max(1, maxOf(series.map((s) => s.searches)));
    if (chartMode === "ai") return Math.max(1, maxOf(series.map((s) => s.aiCalls)));
    return Math.max(1, maxOf(series.map((s) => s.signups)));
  }, [series, chartMode]);

  const payRatio =
    metrics.totalUsers > 0
      ? Math.round((metrics.proEntitledAccounts / metrics.totalUsers) * 100)
      : 0;
  const healthRatio =
    metrics.totalUsers > 0
      ? Math.round(((metrics.totalUsers - metrics.pastDueUsers) / metrics.totalUsers) * 100)
      : 100;

  async function onRefresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="mr-auto text-xs text-slate-500 dark:text-slate-400">
          Data loads on the server — refresh to pull latest.
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={refreshing}
          className="inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {refreshing ? "Refreshing…" : "Refresh data"}
        </button>
      </div>

      {/* Progress / mix */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Plan mix</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Pro-entitled (DB flags) vs everyone else. Stripe paying subscribers:{" "}
            <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
              {metrics.payingSubscribers}
            </span>
            .
          </p>
          <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
              style={{ width: `${payRatio}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {metrics.proEntitledAccounts}
              </span>{" "}
              Pro-entitled
            </span>
            <span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {metrics.freeUsers}
              </span>{" "}
              free / other
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Payment health</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Share of users not in <span className="font-medium">past_due</span>.
          </p>
          <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-amber-100/80 dark:bg-amber-950/40">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${healthRatio}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>
              <span className="font-semibold text-amber-700 dark:text-amber-300">
                {metrics.pastDueUsers}
              </span>{" "}
              past due
            </span>
            <span className="tabular-nums">{healthRatio}% healthy</span>
          </div>
        </div>
      </div>

      {/* 14-day chart */}
      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Activity (14 days, UTC)
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Google search API calls, AI calls, and new signups per day.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["all", "All"],
                ["searches", "Searches"],
                ["ai", "AI"],
                ["signups", "Signups"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setChartMode(id)}
                className={
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition " +
                  (chartMode === id
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700")
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600" /> Searches
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-violet-500" /> AI calls
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Signups
          </span>
          <span className="ml-auto tabular-nums text-slate-500">
            Today: <span className="font-semibold text-slate-800 dark:text-slate-200">{metrics.searchesToday}</span>{" "}
            searches
          </span>
        </div>

        <div className="mt-4 overflow-x-auto pb-1">
          <div className="flex min-w-[640px] gap-1">
            {series.map((s) => {
              const pct = (n: number) =>
                n <= 0 ? 0 : Math.max(3, Math.round((n / chartMax) * 100));
              const hSearch = pct(s.searches);
              const hAi = pct(s.aiCalls);
              const hSig = pct(s.signups);
              const show = chartMode === "all" ? null : chartMode;
              const barWidth =
                show === null ? "flex-1 min-w-[6px]" : "w-full max-w-[18px] min-w-[10px] mx-auto";
              return (
                <div key={s.day} className="min-w-0 flex-1 space-y-1">
                  <div className="flex h-28 items-end justify-center gap-0.5 px-0.5">
                    {(show === null || show === "searches") && (
                      <div
                        className={`${barWidth} rounded-t bg-indigo-600/90`}
                        style={{ height: `${hSearch}%` }}
                        title={`${s.day} searches: ${s.searches}`}
                      />
                    )}
                    {(show === null || show === "ai") && (
                      <div
                        className={`${barWidth} rounded-t bg-violet-500/90`}
                        style={{ height: `${hAi}%` }}
                        title={`${s.day} AI: ${s.aiCalls}`}
                      />
                    )}
                    {(show === null || show === "signups") && (
                      <div
                        className={`${barWidth} rounded-t bg-emerald-500/90`}
                        style={{ height: `${hSig}%` }}
                        title={`${s.day} signups: ${s.signups}`}
                      />
                    )}
                  </div>
                  <div className="text-center text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                    {s.day.slice(5)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Billing feed interactive */}
      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Billing feed</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Stripe / webhook signals — filter by severity.
            </p>
          </div>
          <Link
            href="/owner/alerts"
            className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Open alerts →
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(
            [
              ["all", "All", billingEvents.length] as const,
              ["critical", "Critical", billingEvents.filter((e) => e.severity === "critical").length] as const,
              ["warning", "Warning", billingEvents.filter((e) => e.severity === "warning").length] as const,
              ["info", "Info", billingEvents.filter((e) => e.severity === "info").length] as const,
            ] as const
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              onClick={() => setBillingFilter(id)}
              className={
                "rounded-full px-3 py-1.5 text-xs font-semibold transition " +
                (billingFilter === id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200")
              }
            >
              {label}
              <span className="ml-1 tabular-nums opacity-70">({count})</span>
            </button>
          ))}
        </div>

        {billingEvents.length === 0 && (
          <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-400">
            No billing events recorded yet. When Stripe webhooks are configured, subscription and payment signals will
            appear here and in{" "}
            <Link href="/owner/alerts" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
              alerts
            </Link>
            .
          </p>
        )}

        <ul className="mt-4 max-h-[min(420px,50vh)] space-y-2 overflow-y-auto pr-1">
          {filteredBilling.map((e) => (
            <li
              key={e.id}
              className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800/70 dark:bg-slate-950/20"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-sm font-semibold text-slate-900 dark:text-white">{e.title}</p>
                <span
                  className={
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide " +
                    (e.severity === "critical"
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200"
                      : e.severity === "warning"
                        ? "bg-amber-50 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200")
                  }
                >
                  {e.severity}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {new Date(e.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {e.userEmail ? ` · ${e.userEmail}` : ""}
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {e.kind}
                </span>
              </p>
            </li>
          ))}
          {billingEvents.length > 0 && filteredBilling.length === 0 && (
            <li className="text-sm text-slate-500">No events for this filter.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
