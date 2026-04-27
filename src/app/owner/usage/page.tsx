import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";
import { getUtcDayString } from "@/lib/search-usage";
import { ownerUsageLastNDays, ownerTopUsersBySearches } from "@/actions/owner-usage";
import { UsageChart } from "./UsageChart";

export default async function OwnerUsagePage() {
  await requireOwnerOrRedirect();
  const day = getUtcDayString();

  const [series, top] = await Promise.all([
    ownerUsageLastNDays(14),
    ownerTopUsersBySearches(day),
  ]);

  const totalSearchesToday = top.reduce((s, r) => s + r.count, 0);
  const totalAiToday = await prisma.aiDayUsage.aggregate({
    where: { day },
    _sum: { count: true },
  });

  return (
    <div className="w-full min-w-0 max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Usage
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Per-day usage and top users. (Search quota = Google API calls; cached hits don’t count.)
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Last 14 days
          </h2>
          <div className="mt-4">
            <UsageChart data={series} />
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/60 p-5 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-950/20">
          <p className="text-sm font-medium text-indigo-900/80 dark:text-indigo-200">
            Today
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {totalSearchesToday}
          </p>
          <p className="mt-1 text-xs text-indigo-900/70 dark:text-indigo-200/70">
            Total searches today ({day})
          </p>
          <p className="mt-4 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {totalAiToday._sum.count ?? 0}
          </p>
          <p className="mt-1 text-xs text-indigo-900/70 dark:text-indigo-200/70">
            Total AI calls today
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="px-4 py-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Top users by searches (today)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {top.map((r) => (
                <tr key={r.userId}>
                  <td className="px-4 py-3">
                    <Link
                      className="font-medium text-indigo-600 dark:text-indigo-400"
                      href={`/owner/users/${r.userId}`}
                    >
                      {r.name || r.email}
                    </Link>
                    <div className="text-xs text-slate-500">{r.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {r.plan}
                    </span>
                    {r.disabled && (
                      <span className="ml-2 rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                        disabled
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-semibold">
                    {r.count}
                  </td>
                </tr>
              ))}
              {top.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={3}>
                    No usage recorded today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

