import Link from "next/link";
import {
  formatMinorUnits,
  getOwnerStripeCustomerBilling,
  stripeDashboardCustomerUrl,
} from "@/lib/stripe-owner-customer-billing";

function invoiceStatusClass(status: string) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
    case "open":
      return "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200";
    case "draft":
      return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
    case "void":
    case "uncollectible":
      return "bg-rose-50 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200";
    default:
      return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
  }
}

export async function OwnerCustomerBillingHistory({
  stripeCustomerId,
  stripeConfigured,
}: {
  stripeCustomerId: string | null;
  stripeConfigured: boolean;
}) {
  if (!stripeConfigured) {
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Payments &amp; invoices</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Stripe is not configured — no live billing data to show.
        </p>
      </section>
    );
  }

  if (!stripeCustomerId) {
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Payments &amp; invoices</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          This user has no Stripe customer id yet — they have not completed a billed checkout.
        </p>
      </section>
    );
  }

  const data = await getOwnerStripeCustomerBilling(stripeCustomerId);
  const dashUrl = stripeDashboardCustomerUrl(stripeCustomerId);

  if (!data) {
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Payments &amp; invoices</h2>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
          Could not load Stripe data. Check API keys and try again.
        </p>
        <Link
          href={dashUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Open customer in Stripe →
        </Link>
      </section>
    );
  }

  const { invoices, failedCharges } = data;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Payments &amp; invoices</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Pulled from Stripe for this customer (read-only).
          </p>
        </div>
        <Link
          href={dashUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Open in Stripe →
        </Link>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs leading-relaxed text-slate-600 dark:border-slate-800/80 dark:bg-slate-950/30 dark:text-slate-300">
        <p className="font-semibold text-slate-800 dark:text-slate-100">How this maps to the in-app plan</p>
        <p className="mt-1">
          Pro stays available while Stripe reports <span className="font-medium">active</span>,{" "}
          <span className="font-medium">trialing</span>, or <span className="font-medium">past_due</span> (payment
          grace). If the subscription ends up <span className="font-medium">canceled</span> or{" "}
          <span className="font-medium">unpaid</span> (card still failing after retries), the app treats them as
          off Pro and they return to Starter/free limits once synced from Stripe.
        </p>
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Invoices
        </h3>
        {invoices.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No invoices returned for this customer.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Date</th>
                  <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Invoice</th>
                  <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Status</th>
                  <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Paid</th>
                  <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Due</th>
                  <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="bg-white dark:bg-slate-900">
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600 dark:text-slate-400">
                      {new Date(inv.createdUnix * 1000).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {inv.number ?? `${inv.id.slice(0, 14)}…`}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${invoiceStatusClass(inv.status)}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-900 dark:text-white">
                      {formatMinorUnits(inv.amountPaid, inv.currency)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-600 dark:text-slate-300">
                      {inv.amountDue > 0 ? formatMinorUnits(inv.amountDue, inv.currency) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {inv.hostedInvoiceUrl ? (
                        <a
                          href={inv.hostedInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Failed card charges
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Recent charge attempts that failed (declined card, insufficient funds, etc.). Successful payments appear
          as paid invoices above.
        </p>
        {failedCharges.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            No failed charges in the recent history Stripe returned.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {failedCharges.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-rose-200/70 bg-rose-50/50 p-3 dark:border-rose-900/40 dark:bg-rose-950/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                    {formatMinorUnits(c.amount, c.currency)} ·{" "}
                    {new Date(c.createdUnix * 1000).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <span className="font-mono text-[10px] text-rose-700/80 dark:text-rose-300/80">{c.id}</span>
                </div>
                {c.failureCode ? (
                  <p className="mt-1 text-xs font-medium text-rose-800 dark:text-rose-200">{c.failureCode}</p>
                ) : null}
                {c.failureMessage ? (
                  <p className="mt-1 text-xs text-rose-800 dark:text-rose-200">{c.failureMessage}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
