import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";
import { getUtcDayString } from "@/lib/search-usage";

function moneyUSD(cents: number) {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

export default async function OwnerOverviewPage() {
  await requireOwnerOrRedirect();

  const day = getUtcDayString();

  const [totalUsers, payingUsers, activeUsers30d, totalSearchesToday, pastDueUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { plan: "pro", subscriptionStatus: { in: ["active", "trialing", "past_due"] } },
      }),
      prisma.user.count({
        where: { updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.searchDayUsage.aggregate({
        where: { day },
        _sum: { count: true },
      }),
      prisma.user.count({ where: { subscriptionStatus: "past_due" } }),
    ]);

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickLink href="/owner/revenue" title="Revenue" sub="Stripe + estimates" />
        <QuickLink href="/owner/usage" title="Usage" sub="Search + AI calls" />
        <QuickLink href="/owner/flags" title="Flags" sub="Feature rollouts" />
      </div>
    </div>
  );
}

function QuickLink({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition hover:-translate-y-[1px] hover:bg-white dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:bg-slate-900"
    >
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
      <p className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
        Open <span className="transition group-hover:translate-x-0.5">→</span>
      </p>
    </Link>
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

