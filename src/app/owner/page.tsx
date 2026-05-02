import Link from "next/link";
import { ownerUsageLastNDays } from "@/actions/owner-usage";
import { OwnerHealthDashboard } from "@/components/owner/OwnerHealthDashboard";
import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";
import { getUtcDayString } from "@/lib/search-usage";

function moneyUSD(cents: number) {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

function formatShortDateTime(d: Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export default async function OwnerOverviewPage() {
  await requireOwnerOrRedirect();

  const day = getUtcDayString();
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const since24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    payingUsers,
    activeUsers30d,
    totalSearchesToday,
    pastDueUsers,
    recentUsers,
    billingEvents,
    topSearchUsersToday,
    usageSeriesRaw,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { plan: "pro", subscriptionStatus: { in: ["active", "trialing", "past_due"] } },
    }),
    prisma.user.count({
      where: { updatedAt: { gte: since30 } },
    }),
    prisma.searchDayUsage.aggregate({
      where: { day },
      _sum: { count: true },
    }),
    prisma.user.count({ where: { subscriptionStatus: "past_due" } }),
    prisma.user.findMany({
      where: { createdAt: { gte: since24 } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        plan: true,
        role: true,
        disabled: true,
      },
    }),
    prisma.ownerBillingEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        severity: true,
        kind: true,
        title: true,
        user: { select: { email: true } },
      },
    }),
    prisma.searchDayUsage.findMany({
      where: { day },
      orderBy: { count: "desc" },
      take: 8,
      select: {
        count: true,
        user: { select: { email: true, name: true, disabled: true } },
      },
    }),
    ownerUsageLastNDays(14),
  ]);

  const daysWindow = usageSeriesRaw.map((r) => r.day);
  const windowStart = daysWindow[0]
    ? new Date(`${daysWindow[0]}T00:00:00.000Z`)
    : since24;
  const newUsersInWindow = await prisma.user.findMany({
    where: { createdAt: { gte: windowStart } },
    select: { createdAt: true },
  });
  const signupsByDay = new Map<string, number>();
  for (const d of daysWindow) signupsByDay.set(d, 0);
  for (const u of newUsersInWindow) {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (signupsByDay.has(key)) signupsByDay.set(key, (signupsByDay.get(key) ?? 0) + 1);
  }
  const healthSeries = usageSeriesRaw.map((r) => ({
    day: r.day,
    searches: r.searches,
    aiCalls: r.aiCalls,
    signups: signupsByDay.get(r.day) ?? 0,
  }));

  const freeUsers = Math.max(0, totalUsers - payingUsers);
  const billingFeedPayload = billingEvents.map((e) => ({
    id: e.id,
    createdAt: e.createdAt.toISOString(),
    severity: e.severity,
    kind: e.kind,
    title: e.title,
    userEmail: e.user?.email ?? null,
  }));

  // Approx monthly revenue (best-effort): count pro users * env price (fallback $29)
  const proMonthlyCents =
    Math.round((Number(process.env.PRO_MONTHLY_PRICE_USD ?? "29") || 29) * 100);
  const monthlyRevenueCents = payingUsers * proMonthlyCents;

  return (
    <div className="w-full min-w-0 max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Overview
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Global health
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Quick snapshot across accounts, billing signals, and usage.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/owner/users"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Manage users
          </Link>
          <Link
            href="/owner/alerts"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            View alerts
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card label="Total users" value={totalUsers} hint="All accounts" />
        <Card label="Active users" value={activeUsers30d} hint="Updated in last 30 days" />
        <Card label="Paying users" value={payingUsers} hint="Pro active/trialing/past_due" />
        <Card
          label="Monthly revenue (est.)"
          value={moneyUSD(monthlyRevenueCents)}
          hint={`Uses env PRO_MONTHLY_PRICE_USD (default $29)`}
        />
        <Card
          label="API usage (today)"
          value={totalSearchesToday._sum.count ?? 0}
          hint="Total Google searches across users"
        />
        <Card
          label="Failed / past_due"
          value={pastDueUsers}
          hint="Users in past_due (watch payments)"
          tone="amber"
        />
      </div>

      <OwnerHealthDashboard
        series={healthSeries}
        billingEvents={billingFeedPayload}
        metrics={{
          totalUsers,
          payingUsers,
          freeUsers,
          pastDueUsers,
          searchesToday: totalSearchesToday._sum.count ?? 0,
        }}
      />

      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Live snapshot</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Recent signups + today’s usage. Refresh to update.
            </p>
          </div>
          <Link
            href="/owner/usage"
            className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Open usage →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800/70 dark:bg-slate-950/20">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  New accounts (24h)
                </p>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {recentUsers.length}
                </span>
              </div>
              {recentUsers.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No new users in the last 24 hours.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {recentUsers.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-3">
                      <Link
                        href={`/owner/users/${u.id}`}
                        className="min-w-0 truncate text-sm font-semibold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-300"
                      >
                        {u.name || u.email}
                      </Link>
                      <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                        {formatShortDateTime(u.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800/70 dark:bg-slate-950/20">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Top searches (today)
                </p>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Total {totalSearchesToday._sum.count ?? 0}
                </span>
              </div>
              {topSearchUsersToday.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No searches recorded yet today.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {topSearchUsersToday.map((r, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {r.user.name || r.user.email}
                      </span>
                      <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
                        {r.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  hint,
  tone = "indigo",
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "indigo" | "amber";
}) {
  const border =
    tone === "amber"
      ? "border-amber-200/70 dark:border-amber-900/40"
      : "border-slate-200/80 dark:border-slate-800/80";
  const ring =
    tone === "amber"
      ? "ring-amber-200/40 dark:ring-amber-900/30"
      : "ring-indigo-200/30 dark:ring-indigo-500/20";

  return (
    <div
      className={`rounded-2xl border ${border} bg-white/90 p-5 shadow-sm ring-1 ${ring} dark:bg-slate-900/60`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{hint}</p>
    </div>
  );
}

