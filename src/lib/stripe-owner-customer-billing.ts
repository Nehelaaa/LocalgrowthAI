import type Stripe from "stripe";
import { getStripe, isStripeConfigured, stripeSecretKeyResolved } from "@/lib/stripe";

export type OwnerStripeInvoiceRow = {
  id: string;
  createdUnix: number;
  number: string | null;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: string;
  hostedInvoiceUrl: string | null;
};

export type OwnerStripeFailedChargeRow = {
  id: string;
  createdUnix: number;
  amount: number;
  currency: string;
  failureCode: string | null;
  failureMessage: string | null;
};

export function formatMinorUnits(amount: number, currency: string): string {
  const c = currency.length === 3 ? currency.toUpperCase() : "USD";
  return (amount / 100).toLocaleString(undefined, { style: "currency", currency: c });
}

/**
 * Invoices and failed charges for owner review. Requires Stripe secret key.
 */
export async function getOwnerStripeCustomerBilling(
  customerId: string
): Promise<{ invoices: OwnerStripeInvoiceRow[]; failedCharges: OwnerStripeFailedChargeRow[] } | null> {
  if (!isStripeConfigured()) return null;
  try {
    const stripe = getStripe();
    const [invRes, chRes] = await Promise.all([
      stripe.invoices.list({ customer: customerId, limit: 40 }),
      stripe.charges.list({ customer: customerId, limit: 40 }),
    ]);

    const invoices: OwnerStripeInvoiceRow[] = invRes.data
      .filter((inv): inv is Stripe.Invoice & { id: string } => Boolean(inv.id))
      .map((inv) => ({
        id: inv.id,
        createdUnix: inv.created,
        number: inv.number,
        amountPaid: inv.amount_paid ?? 0,
        amountDue: inv.amount_due ?? 0,
        currency: (inv.currency ?? "usd").toUpperCase(),
        status: inv.status ?? "unknown",
        hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
      }));

    const failedCharges: OwnerStripeFailedChargeRow[] = chRes.data
      .filter((c) => c.status === "failed")
      .map((c) => ({
        id: c.id,
        createdUnix: c.created,
        amount: c.amount ?? 0,
        currency: (c.currency ?? "usd").toUpperCase(),
        failureCode: c.failure_code ?? null,
        failureMessage: c.failure_message ?? null,
      }));

    return { invoices, failedCharges };
  } catch (e) {
    console.error("[getOwnerStripeCustomerBilling]", e);
    return null;
  }
}

export function stripeDashboardCustomerUrl(customerId: string): string {
  const test = stripeSecretKeyResolved()?.startsWith("sk_test");
  const base = test ? "https://dashboard.stripe.com/test" : "https://dashboard.stripe.com";
  return `${base}/customers/${customerId}`;
}
