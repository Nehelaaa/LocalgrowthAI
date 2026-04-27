import { requireOwnerOrRedirect } from "@/lib/owner";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

function money(amount: number, currency: string) {
  return (amount / 100).toLocaleString(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  });
}

export default async function OwnerRevenuePage() {
  await requireOwnerOrRedirect();

  if (!isStripeConfigured()) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 dark:border-slate-800/80 dark:bg-slate-900/60">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Revenue
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Stripe is not configured. Set <code>STRIPE_SECRET_KEY</code> and webhook
          env vars.
        </p>
      </div>
    );
  }

  const stripe = getStripe();

  const [subs, invoices] = await Promise.all([
    stripe.subscriptions.list({ status: "active", limit: 100 }),
    stripe.invoices.list({ limit: 25 }),
  ]);

  const mrrCents = subs.data.reduce((sum, s) => {
    const item = s.items.data[0];
    const price = item?.price?.unit_amount ?? 0;
    const interval = item?.price?.recurring?.interval ?? "month";
    // Convert weekly/yearly to rough monthly
    const monthly =
      interval === "year"
        ? Math.round(price / 12)
        : interval === "week"
          ? Math.round(price * 4.33)
          : price;
    return sum + monthly;
  }, 0);

  return (
    <div className="w-full min-w-0 max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Revenue (Stripe)
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          MRR and latest payments from Stripe.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Active subscriptions
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {subs.data.length}
          </p>
        </div>
        <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/60 p-5 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-950/20">
          <p className="text-sm font-medium text-indigo-900/80 dark:text-indigo-200">
            MRR (estimated)
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {money(mrrCents, "usd")}
          </p>
          <p className="mt-1 text-xs text-indigo-900/70 dark:text-indigo-200/70">
            Based on active subscription item unit amounts.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="px-4 py-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Latest invoices
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {invoices.data.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {inv.created
                      ? new Date(inv.created * 1000).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-900 dark:text-white">
                      {typeof inv.customer_email === "string" && inv.customer_email.length
                        ? inv.customer_email
                        : (typeof inv.customer === "string" ? inv.customer : "—")}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums">
                    {money(inv.amount_paid ?? 0, inv.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {inv.status ?? "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {invoices.data.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={4}>
                    No invoices found.
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

