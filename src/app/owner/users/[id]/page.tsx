import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";
import { getUtcDayString } from "@/lib/search-usage";
import { isStripeConfigured } from "@/lib/stripe";
import { OwnerStripeBillingActions } from "./OwnerStripeBillingActions";
import { OwnerUserActions } from "./OwnerUserActions";

type Props = { params: Promise<{ id: string }> };

export default async function OwnerUserDetailPage({ params }: Props) {
  await requireOwnerOrRedirect();
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

      <header className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-slate-900 dark:text-white">
              {user.name || user.email}
            </h1>
            <p className="truncate text-sm text-slate-600 dark:text-slate-400">
              {user.email}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                plan: {user.plan}
              </span>
              {user.role === "ADMIN" && (
                <span className="rounded-lg bg-amber-50 px-2 py-1 font-semibold text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                  owner
                </span>
              )}
              {user.subscriptionStatus && (
                <span className="rounded-lg bg-indigo-50 px-2 py-1 font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
                  {user.subscriptionStatus}
                </span>
              )}
              {user.disabled && (
                <span className="rounded-lg bg-rose-50 px-2 py-1 font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                  disabled
                </span>
              )}
              {user.profession && (
                <span className="rounded-lg bg-amber-50 px-2 py-1 font-semibold text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                  {user.profession}
                </span>
              )}
            </div>
          </div>

          <div className="sm:pt-1">
            <OwnerUserActions
              userId={user.id}
              disabled={user.disabled}
              plan={(user.plan === "pro" ? "pro" : "free") as "free" | "pro"}
              role={user.role}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniStat label="Leads" value={user.leads.length} />
          <MiniStat label="Searches today" value={user.searchDayUsages[0]?.count ?? 0} />
        </div>
      </header>

      <OwnerStripeBillingActions
        userId={user.id}
        stripeConfigured={stripeConfigured}
        stripeCustomerId={user.stripeCustomerId}
        stripeSubscriptionId={user.stripeSubscriptionId}
        subscriptionStatus={user.subscriptionStatus}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
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

        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
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
    <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800/70 dark:bg-slate-950/20">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

