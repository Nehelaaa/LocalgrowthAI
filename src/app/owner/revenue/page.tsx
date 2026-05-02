import type Stripe from "stripe";
import { requireOwnerOrRedirect } from "@/lib/owner";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

function money(amount: number, currency: string) {
  return (amount / 100).toLocaleString(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  });
}

function refundCustomerEmail(r: Stripe.Refund): string {
  const ch = typeof r.charge === "object" && r.charge && !("deleted" in r.charge && r.charge.deleted) ? r.charge : null;
  if (!ch) return "—";
  const cust = ch.customer;
  if (cust && typeof cust === "object" && "email" in cust && cust.email) {
    return String(cust.email);
  }
  if (ch.billing_details?.email) return ch.billing_details.email;
  return "—";
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

  const [subs, invoices, refunds] = await Promise.all([
    stripe.subscriptions.list({ status: "active", limit: 100 }),
    stripe.invoices.list({ limit: 25 }),
    stripe.refunds.list({
      limit: 30,
      expand: ["data.charge", "data.charge.customer"],
    }),
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
          MRR, invoices, and refunds from Stripe. Invoice rows often stay <span className="font-medium">paid</span>{" "}
          after a refund — check credits and the refunds table below.
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
            Based on active subscription item unit amounts (not net of refunds unless you cancel subs).
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Recent refunds
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Card refunds appear here. They do not change the invoice &quot;paid&quot; flag — Stripe tracks refunds separately.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Refunded</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {refunds.data.map((r) => (
                <tr key={r.id} className="bg-rose-50/30 dark:bg-rose-950/10">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(r.created * 1000).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-900 dark:text-white">{refundCustomerEmail(r)}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-rose-800 dark:text-rose-200">
                    −{money(r.amount ?? 0, r.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {r.status ?? "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {refunds.data.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={4}>
                    No refunds in the latest batch from Stripe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <div className="px-4 py-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Latest invoices
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Status reflects collection. Post-payment credits (credit notes) show in the Credits column when Stripe reports them.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Credits</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {invoices.data.map((inv) => {
                const credits = inv.post_payment_credit_notes_amount ?? 0;
                return (
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
                    <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">
                      {credits > 0 ? (
                        <span className="font-medium text-amber-800 dark:text-amber-200">
                          {money(credits, inv.currency)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {inv.status ?? "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {invoices.data.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
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

