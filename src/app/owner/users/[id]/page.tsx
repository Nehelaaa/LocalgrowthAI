import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";
import { getUtcDayString } from "@/lib/search-usage";
import { isStripeConfigured } from "@/lib/stripe";
import { OwnerCustomerBillingHistory } from "./OwnerCustomerBillingHistory";
import { OwnerStripeBillingActions } from "./OwnerStripeBillingActions";
import { OwnerUserActions } from "./OwnerUserActions";

type Props = { params: Promise<{ id: string }> };

export default async function OwnerUserDetailPage({ params }: Props) {
  const session = await requireOwnerOrRedirect();
  const { id } = await params;
  const day = getUtcDayString();

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      leads: {
        include: { business: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      searchDayUsages: { where: { day }, take: 1 },
      aiDayUsages: { where: { day }, take: 1 },
    },
  });

  if (!user) notFound();

  const stripeConfigured = isStripeConfigured();

  return (
    <div className="w-full min-w-0 max-w-6xl space-y-6">
      <Link
        href="/owner/users"
        className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
      >
        ← All users
      </Link>

      <header className="rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04] dark:border-slate-700/90 dark:bg-slate-900/85 dark:ring-white/[0.06]">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {user.name || user.email}
            </h1>
            <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200">
                {user.plan}
              </span>
              {user.role === "ADMIN" && (
                <span className="rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
                  Owner
                </span>
              )}
              {user.subscriptionStatus && (
                <span className="rounded-full border border-indigo-200/80 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-100">
                  {user.subscriptionStatus}
                </span>
              )}
              {user.disabled && (
                <span className="rounded-full border border-rose-200/80 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-100">
                  Disabled
                </span>
              )}
              {user.profession && (
                <span className="rounded-full border border-violet-200/70 bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-900 dark:border-violet-500/25 dark:bg-violet-950/35 dark:text-violet-100">
                  {user.profession}
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0 w-full shrink-0 border-t border-slate-100 pt-3 sm:border-t-0 sm:border-l sm:pl-5 sm:pt-0 dark:border-slate-800">
            <OwnerUserActions
              userId={user.id}
              currentUserId={session.user.id}
              disabled={user.disabled}
              plan={(user.plan === "pro" ? "pro" : "free") as "free" | "pro"}
              role={user.role}
              stripeSubscriptionId={user.stripeSubscriptionId}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px border-t border-slate-100 bg-slate-100 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-800">
          <MiniStat label="Leads" value={user.leads.length} />
          <MiniStat label="Searches today" value={user.searchDayUsages[0]?.count ?? 0} />
        </div>
      </header>

      <OwnerCustomerBillingHistory
        stripeConfigured={stripeConfigured}
        stripeCustomerId={user.stripeCustomerId}
      />

      <OwnerStripeBillingActions
        userId={user.id}
        stripeConfigured={stripeConfigured}
        stripeCustomerId={user.stripeCustomerId}
        stripeSubscriptionId={user.stripeSubscriptionId}
        subscriptionStatus={user.subscriptionStatus}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700/90 dark:bg-slate-900/85 dark:ring-white/[0.05]">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Recent leads
          </h2>
          {user.leads.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No leads yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {user.leads.map((l) => (
                <li key={l.id} className="rounded-xl border border-slate-200/70 p-3 dark:border-slate-800/70">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {l.business.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {l.business.city ? `${l.business.city}, ` : ""}
                    {l.business.state ?? ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    score {l.leadScore} · {l.badge} · {l.contactStatus}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700/90 dark:bg-slate-900/85 dark:ring-white/[0.05]">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Recent activity
          </h2>
          {user.activityLogs.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No activity logs yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {user.activityLogs.map((a) => (
                <li key={a.id} className="rounded-xl border border-slate-200/70 p-3 text-sm dark:border-slate-800/70">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {a.action}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(a.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white px-5 py-4 dark:bg-slate-900/90">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

