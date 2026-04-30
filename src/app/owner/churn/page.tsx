import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";

type Meta = Record<string, unknown> | null;

function readMetaString(meta: unknown, key: string): string | null {
  if (!meta || typeof meta !== "object") return null;
  const v = (meta as Record<string, unknown>)[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

export default async function OwnerChurnPage() {
  await requireOwnerOrRedirect();

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [cancellations, scheduledEnds, churn30d] = await Promise.all([
    prisma.ownerBillingEvent.findMany({
      where: { kind: "subscription_canceled" },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { id: true, email: true, name: true } } },
    }),
    prisma.ownerBillingEvent.findMany({
      where: { title: "Subscription set to cancel at period end" },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, email: true, name: true } } },
    }),
    prisma.ownerBillingEvent.count({
      where: {
        kind: "subscription_canceled",
        createdAt: { gte: since30 },
      },
    }),
  ]);

  return (
    <div className="w-full min-w-0 max-w-6xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Churn tracking</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
          Rows come from Stripe webhooks logged in <strong>OwnerBillingEvent</strong>. “When” is when we
          recorded the event (usually within seconds of Stripe). Cancellation reason appears when Stripe
          sends it (often empty for manual cancels).
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/owner/billing-playbook"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Billing playbook
          </Link>
          <span className="text-slate-600 dark:text-slate-400">
            {" "}
            — cancel flows, owner visibility, and Stripe checklist.
          </span>
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last 30 days</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{churn30d}</p>
          <p className="mt-1 text-xs text-slate-500">Subscription canceled / deleted events</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">All-time (stored)</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {cancellations.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Latest 200 cancel events in this table</p>
        </div>
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
            Scheduled cancels
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-amber-950 dark:text-amber-50">
            {scheduledEnds.length}
          </p>
          <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
            Users who turned off renewal (still active until period end)
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Who canceled &amp; when</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Use this to spot payment failures vs voluntary churn. Cross-check{" "}
          <Link href="/owner/alerts" className="font-medium text-indigo-600 underline dark:text-indigo-400">
            Alerts
          </Link>{" "}
          for disputes and failed renewals.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <tr>
                <th className="py-2 pr-4">When (logged)</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Stripe</th>
                <th className="py-2 pr-4">Why (from Stripe)</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
              {cancellations.map((e) => {
                const meta = e.metadata as Meta;
                const reason = readMetaString(meta, "cancellationReason");
                return (
                  <tr key={e.id}>
                    <td className="py-3 pr-4 align-top text-slate-600 dark:text-slate-300">
                      {new Date(e.createdAt).toLocaleString()}
                      {readMetaString(meta, "canceledAt") ? (
                        <p className="mt-0.5 text-xs text-slate-500">
                          Stripe canceled_at:{" "}
                          {new Date(readMetaString(meta, "canceledAt")!).toLocaleString()}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 align-top">
                      {e.user ? (
                        <>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {e.user.name || e.user.email}
                          </p>
                          <p className="text-xs text-slate-500">{e.user.email}</p>
                        </>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 align-top font-mono text-xs text-slate-600 dark:text-slate-400">
                      <div className="max-w-[140px] truncate" title={e.stripeCustomerId ?? ""}>
                        {e.stripeCustomerId ?? "—"}
                      </div>
                      <div className="mt-1 max-w-[140px] truncate text-slate-500" title={e.stripeSubscriptionId ?? ""}>
                        {e.stripeSubscriptionId ?? ""}
                      </div>
                    </td>
                    <td className="py-3 pr-4 align-top text-slate-700 dark:text-slate-300">
                      <p className="text-xs font-medium text-slate-900 dark:text-white">{e.title}</p>
                      {reason ? (
                        <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">Reason: {reason}</p>
                      ) : null}
                      {e.body ? (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{e.body}</p>
                      ) : null}
                    </td>
                    <td className="py-3 align-top">
                      {e.userId ? (
                        <Link
                          href={`/owner/users/${e.userId}`}
                          className="inline-flex min-h-9 items-center rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white"
                        >
                          User
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {cancellations.length === 0 ? (
                <tr>
                  <td className="py-8 text-slate-500" colSpan={5}>
                    No cancellation events yet. They appear when Stripe sends{" "}
                    <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">customer.subscription.deleted</code>{" "}
                    or canceled status updates.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Scheduled to cancel</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          These customers still have access until the billing period ends unless they re-enable renewal in the
          portal.
        </p>
        <ul className="mt-4 space-y-2">
          {scheduledEnds.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800/70 dark:bg-slate-950/20"
            >
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {e.user?.name || e.user?.email || e.stripeCustomerId || "Unknown"}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(e.createdAt).toLocaleString()}
                  {e.user?.email ? ` · ${e.user.email}` : ""}
                </p>
                {e.body ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{e.body}</p> : null}
              </div>
              {e.userId ? (
                <Link
                  href={`/owner/users/${e.userId}`}
                  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400"
                >
                  View →
                </Link>
              ) : null}
            </li>
          ))}
          {scheduledEnds.length === 0 ? (
            <li className="text-sm text-slate-500">None recorded.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
