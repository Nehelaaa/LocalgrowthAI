import Link from "next/link";
import {
  billingSituations,
  customerBillingFaq,
  ownerVisibility,
  stripeOperatorChecklist,
  stripeWebhookEventsRecommended,
} from "@/lib/billing-policies";
import { requireOwnerOrRedirect } from "@/lib/owner";

export default async function OwnerBillingPlaybookPage() {
  await requireOwnerOrRedirect();

  return (
    <div className="w-full min-w-0 max-w-4xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Billing playbook</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          How customers cancel and upgrade, where you see it in this dashboard, and how Stripe should be
          configured. Behavior is enforced in code via webhooks and{" "}
          <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">entitlements.ts</code>.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Customer: cancel after upgrade?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <strong className="text-slate-900 dark:text-white">Yes.</strong> Once they have a Stripe customer
          and subscription, they open the{" "}
          <strong className="text-slate-900 dark:text-white">billing portal</strong> from{" "}
          <Link href="/dashboard/plan" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Plans &amp; billing
          </Link>
          . What they can do there (cancel, change card, invoices) is controlled in{" "}
          <strong className="text-slate-900 dark:text-white">Stripe Dashboard → Settings → Customer portal</strong>.
          This app does not replace Stripe for cancellation UI—it deep-links to the portal.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Where owners see events
        </h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <li>
            <Link
              href={ownerVisibility.alertsFeed.path}
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Alerts
            </Link>
            {" — "}
            {ownerVisibility.alertsFeed.description}
          </li>
          <li>
            <Link
              href={ownerVisibility.churnPage.path}
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Churn
            </Link>
            {" — "}
            {ownerVisibility.churnPage.description}
          </li>
          <li>
            <Link
              href={ownerVisibility.revenue.path}
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Revenue
            </Link>
            {" — "}
            {ownerVisibility.revenue.description}
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Stripe operator checklist
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
          {stripeOperatorChecklist.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Webhook events to subscribe
        </h2>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Paste into Stripe → Developers → Webhooks → your endpoint → “Select events”.
        </p>
        <ul className="mt-3 grid gap-1 font-mono text-xs text-slate-800 dark:text-slate-200 sm:grid-cols-2">
          {stripeWebhookEventsRecommended.map((ev) => (
            <li key={ev} className="rounded bg-slate-50 px-2 py-1 dark:bg-slate-800/80">
              {ev}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Situations &amp; policies
        </h2>
        <div className="mt-4 space-y-5">
          {billingSituations.map((row) => (
            <div
              key={row.situation}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30"
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{row.situation}</h3>
              <dl className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <div>
                  <dt className="font-medium text-slate-700 dark:text-slate-300">Customer</dt>
                  <dd>{row.customerExperience}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-700 dark:text-slate-300">Owner</dt>
                  <dd>{row.ownerWhereToLook}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-700 dark:text-slate-300">App</dt>
                  <dd>{row.appBehavior}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-900/40 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Same copy on the customer plan page
        </h2>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Title: {customerBillingFaq.cancelTitle}
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-400">
          {customerBillingFaq.cancelBody.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
