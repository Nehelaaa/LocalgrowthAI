import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";
import { getUtcDayString } from "@/lib/search-usage";

export default async function OwnerAlertsPage() {
  await requireOwnerOrRedirect();
  const day = getUtcDayString();

  const highSearchThreshold = Number(process.env.ALERT_SEARCHES_PER_DAY ?? "80") || 80;

  const [pastDueUsers, highUsage, disabledUsers, billingEvents] = await Promise.all([
    prisma.user.findMany({
      where: { subscriptionStatus: "past_due" },
      select: { id: true, email: true, name: true, plan: true },
      take: 50,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.searchDayUsage.findMany({
      where: { day, count: { gte: highSearchThreshold } },
      include: { user: { select: { id: true, email: true, name: true, plan: true } } },
      orderBy: { count: "desc" },
      take: 50,
    }),
    prisma.user.findMany({
      where: { disabled: true },
      select: { id: true, email: true, name: true, plan: true },
      take: 50,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.ownerBillingEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { id: true, email: true, name: true } } },
    }),
  ]);

  return (
    <div className="w-full min-w-0 max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Alerts
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Warnings for high usage and payment issues. Thresholds are configurable via env.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Billing & risk events (Stripe)
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Recent webhook-driven events (refunds, disputes, failed renewals, cancellations). Owner actions are
          logged here too.
        </p>
        {billingEvents.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">None yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {billingEvents.map((e) => (
              <li
                key={e.id}
                className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800/70 dark:bg-slate-950/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {e.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(e.createdAt).toLocaleString()} ·{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-200">{e.kind}</span> ·{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-200">{e.severity}</span>
                    </p>
                    {e.body ? (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{e.body}</p>
                    ) : null}
                    {e.user ? (
                      <p className="mt-2 truncate text-xs text-slate-600 dark:text-slate-300">
                        User: {e.user.name || e.user.email} ({e.user.email})
                      </p>
                    ) : e.stripeCustomerId ? (
                      <p className="mt-2 truncate text-xs text-slate-600 dark:text-slate-300">
                        Stripe customer: {e.stripeCustomerId}
                      </p>
                    ) : null}
                  </div>
                  {e.userId ? (
                    <Link
                      className="min-h-10 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white"
                      href={`/owner/users/${e.userId}`}
                    >
                      View
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AlertBlock
        title="Failed payments / past_due"
        description="Users whose subscriptions are past_due."
        items={pastDueUsers.map((u) => ({
          id: u.id,
          label: u.name || u.email,
          sub: `${u.email} · plan ${u.plan}`,
        }))}
      />

      <AlertBlock
        title="High API usage (today)"
        description={`Users over ${highSearchThreshold} searches today (${day}).`}
        items={highUsage.map((r) => ({
          id: r.user.id,
          label: r.user.name || r.user.email,
          sub: `${r.user.email} · ${r.count} searches`,
        }))}
      />

      <AlertBlock
        title="Disabled users"
        description="Accounts you disabled (blocked from using the app)."
        items={disabledUsers.map((u) => ({
          id: u.id,
          label: u.name || u.email,
          sub: `${u.email} · plan ${u.plan}`,
        }))}
      />
    </div>
  );
}

function AlertBlock({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ id: string; label: string; sub: string }>;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">None.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((i) => (
            <li
              key={i.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-2 dark:border-slate-800/70 dark:bg-slate-950/20"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                  {i.label}
                </p>
                <p className="truncate text-xs text-slate-500">{i.sub}</p>
              </div>
              <Link
                className="min-h-10 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white"
                href={`/owner/users/${i.id}`}
              >
                View
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

