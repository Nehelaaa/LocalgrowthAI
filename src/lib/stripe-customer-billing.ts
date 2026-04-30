import type Stripe from "stripe";
import type { User } from "@prisma/client";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export type StripePlanPresentment = {
  productName: string;
  priceFormatted: string;
  intervalLabel: string;
  currency: string;
};

export type SafeInvoiceRow = {
  id: string;
  number: string | null;
  createdUnix: number;
  amountPaid: number;
  currency: string;
  status: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
};

function intervalLabel(interval: string | null | undefined): string {
  if (!interval) return "per cycle";
  if (interval === "month") return "per month";
  if (interval === "year") return "per year";
  if (interval === "week") return "per week";
  return interval;
}

/** Live Stripe subscription → product name + recurring price for billing UI. */
export async function getStripePlanPresentment(
  user: Pick<User, "stripeSubscriptionId">
): Promise<StripePlanPresentment | null> {
  if (!user.stripeSubscriptionId || !isStripeConfigured()) return null;
  try {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
      expand: ["items.data.price.product"],
    });
    const item = sub.items.data[0];
    const price = item?.price;
    if (!price) return null;
    const product = price.product;
    const productName =
      typeof product === "object" && product && "deleted" in product && !product.deleted && "name" in product
        ? String((product as Stripe.Product).name)
        : typeof product === "string"
          ? "Subscription"
          : "Pro";
    const amount = price.unit_amount;
    const currency = (price.currency ?? "usd").toUpperCase();
    const priceFormatted =
      amount != null
        ? (amount / 100).toLocaleString(undefined, {
            style: "currency",
            currency,
          })
        : "—";
    return {
      productName,
      priceFormatted,
      intervalLabel: intervalLabel(price.recurring?.interval),
      currency,
    };
  } catch {
    return null;
  }
}

/** Paid / open invoices for customer portal context (read-only). */
export async function listInvoicesForCustomer(
  customerId: string,
  limit = 24
): Promise<SafeInvoiceRow[]> {
  if (!isStripeConfigured() || !customerId) return [];
  try {
    const stripe = getStripe();
    const res = await stripe.invoices.list({
      customer: customerId,
      limit,
    });
    return res.data
      .filter((inv): inv is Stripe.Invoice & { id: string } => Boolean(inv.id))
      .map((inv) => ({
        id: inv.id,
        number: inv.number,
        createdUnix: inv.created,
        amountPaid: inv.amount_paid ?? 0,
        currency: (inv.currency ?? "usd").toUpperCase(),
        status: inv.status,
        hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
        invoicePdf: inv.invoice_pdf ?? null,
      }));
  } catch {
    return [];
  }
}
