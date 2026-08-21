import Link from "next/link";
import { requireOwnerOrRedirect } from "@/lib/owner";
import {
  aggregateApiUsageForDayRange,
  getStripeActiveSubscriptionSnapshot,
  sumPaidInvoicesSince,
  utcDayRangeStrings,
} from "@/lib/owner-economics";
import { getUtcDayString } from "@/lib/search-usage";
import { isStripeConfigured } from "@/lib/stripe";

function usd(amount: number) {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function moneyCents(cents: number) {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export default async function OwnerCostsPage() {
  await requireOwnerOrRedirect();

  const today = getUtcDayString();
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const range7 = utcDayRangeStrings(d7, now);
  const range30 = utcDayRangeStrings(d30, now);

  const [todayUsage, usage7, usage30, paid30, stripeSnap] = await Promise.all([
    aggregateApiUsageForDayRange(today, today),
    aggregateApiUsageForDayRange(range7.startDay, range7.endDay),
    aggregateApiUsageForDayRange(range30.startDay, range30.endDay),
    sumPaidInvoicesSince(Math.floor(d30.getTime() / 1000)),
    getStripeActiveSubscriptionSnapshot(),
  ]);

  const stripeOk = isStripeConfigured();
  const revenue30Usd = paid30.cents / 100;
  const cost30Usd = usage30.totalUsd;
  const net30Usd = revenue30Usd - cost30Usd;
  const mrrCents = stripeSnap.mrrCents;
  const mrrUsd = mrrCents / 100;
  /** Rough: if MRR held steady, annualized API cost vs monthly revenue (not GAAP). */
  const estMonthlyApiCostFrom30d = (cost30Usd / 30) * 30;

  return (
    <div className="w-full min-w-0 max-w-6xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cost &amp; margin monitoring</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
          <strong>Google</strong> costs are <strong>estimates</strong> from your own usage tables and configurable unit
          rates. Tune{" "}
          <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">GOOGLE_COST_PER_SEARCH_USD</code> to
          match your real Google Cloud bills.
        </p>
      </header>

      {stripeOk ? (
        <section className="rounded-2xl border-2 border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 to-white p-6 shadow-sm dark:border-indigo-500/30 dark:from-indigo-950/40 dark:to-slate-900/80">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-900 dark:text-indigo-200">
            Revenue vs estimated API cost
          </h2>
          <p className="mt-1 text-xs text-indigo-900/80 dark:text-indigo-200/80">
            <strong>30-day cash (Stripe):</strong> sum of <code>amount_paid</code> on paid invoices in the window
            {paid30.truncated ? " (first pages only — increase pagination in code if needed)" : ""}.{" "}
            <strong>MRR:</strong> rough total from active subscription line items. API cost uses UTC calendar days.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Paid revenue (30d)" value={moneyCents(paid30.cents)} sub={`${paid30.invoiceCount} invoices`} />
            <Metric label="Est. API cost (30d)" value={usd(cost30Usd)} sub="Google API" />
            <Metric
              label="Net (30d, rough)"
              value={usd(net30Usd)}
              sub={net30Usd >= 0 ? "Revenue − API est." : "Costs higher than invoice cash"}
              highlight={net30Usd < 0 ? "amber" : undefined}
            />
            <Metric label="Stripe MRR (est.)" value={usd(mrrUsd)} sub="Active subs only" />
          </div>
          <p className="mt-4 text-xs text-slate-600 dark:text-slate-400">
            MRR ({usd(mrrUsd)}/mo) vs run-rate API cost from last 30 days (~{usd(estMonthlyApiCostFrom30d)}/mo if usage
            were flat) — use this as a sanity check, not financial statements.
          </p>
        </section>
      ) : (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100">
          Set <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/50">STRIPE_SECRET_KEY</code> to compare
          Stripe cash/MRR to API estimates.
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Usage windows (UTC days)</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <UsageCard title="Today" range={today} usage={todayUsage} />
          <UsageCard title="Last 7 days" range={`${range7.startDay} → ${range7.endDay}`} usage={usage7} />
          <UsageCard title="Last 30 days" range={`${range30.startDay} → ${range30.endDay}`} usage={usage30} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 text-sm text-slate-600 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-400">
        <p>
          <strong className="text-slate-900 dark:text-white">Accuracy:</strong> Search counts are server-side Google
          API calls only (not cache hits). Pair this view with{" "}
          <Link href="/owner/usage" className="font-medium text-indigo-600 underline dark:text-indigo-400">
            Usage charts
          </Link>{" "}
          and{" "}
          <Link href="/owner/churn" className="font-medium text-indigo-600 underline dark:text-indigo-400">
            Churn
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: "amber";
}) {
  const border =
    highlight === "amber"
      ? "border-amber-300/80 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30"
      : "border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-950/40";
  return (
    <div className={`rounded-xl border p-4 ${border}`}>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function UsageCard({
  title,
  range,
  usage,
}: {
  title: string;
  range: string;
  usage: Awaited<ReturnType<typeof aggregateApiUsageForDayRange>>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-0.5 font-mono text-xs text-slate-500">{range}</p>
      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs text-slate-500">Google (Places API calls)</p>
          <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{usd(usage.googleUsd)}</p>
          <p className="text-xs text-slate-500">
            {usage.searchCalls} × {usage.googleUnitUsd}/call
          </p>
        </div>
        <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Estimated cost</p>
          <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{usd(usage.googleUsd)}</p>
        </div>
      </div>
    </div>
  );
}
