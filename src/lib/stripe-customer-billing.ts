import type Stripe from "stripe";
import type { User } from "@prisma/client";
import { getStripe, isStripeConfigured, proPriceId } from "@/lib/stripe";

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
  /** Post-payment credit notes (often refunds/credits) in minor units — from Stripe invoice. */
  postPaymentCreditNotesAmount: number;
};

/** Charge-level activity — refunds are visible here even when the invoice row still says “Paid”. */
export type SafePaymentActivityRow = {
  id: string;
  createdUnix: number;
  currency: string;
  amount: number;
  amountRefunded: number;
  netAfterRefunds: number;
  statusLabel: "Succeeded" | "Partially refunded" | "Refunded";
  description: string | null;
  receiptUrl: string | null;
};

function intervalLabel(interval: string | null | undefined): string {
  if (!interval) return "per cycle";
  if (interval === "month") return "per month";
  if (interval === "year") return "per year";
  if (interval === "week") return "per week";
  return interval;
}

function formatStripePrice(price: Stripe.Price): Pick<
  StripePlanPresentment,
  "priceFormatted" | "intervalLabel" | "currency"
> {
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
    priceFormatted,
    intervalLabel: intervalLabel(price.recurring?.interval),
    currency,
  };
}

function productNameFromPrice(price: Stripe.Price): string {
  const product = price.product;
  return typeof product === "object" &&
    product &&
    "deleted" in product &&
    !product.deleted &&
    "name" in product
    ? String((product as Stripe.Product).name)
    : typeof product === "string"
      ? "Subscription"
      : "Pro";
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
    const productName = productNameFromPrice(price);
    const { priceFormatted, intervalLabel: intervalLabelOut, currency } = formatStripePrice(price);
    return {
      productName,
      priceFormatted,
      intervalLabel: intervalLabelOut,
      currency,
    };
  } catch {
    return null;
  }
}

/**
 * Pro checkout price presentment (does not require an existing subscription).
 * Uses STRIPE_PRICE_ID_PRO to display "X per month" on the plan page.
 */
export async function getProCheckoutPricePresentment(): Promise<StripePlanPresentment | null> {
  if (!isStripeConfigured()) return null;
  let priceId: string;
  try {
    priceId = proPriceId();
  } catch {
    return null;
  }
  try {
    const stripe = getStripe();
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    if (!price) return null;
    const productName = productNameFromPrice(price);
    const { priceFormatted, intervalLabel: intervalLabelOut, currency } = formatStripePrice(price);
    return { productName, priceFormatted, intervalLabel: intervalLabelOut, currency };
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
        postPaymentCreditNotesAmount: inv.post_payment_credit_notes_amount ?? 0,
      }));
  } catch {
    return [];
  }
}

/**
 * Lists card charges for the customer. Refund state comes from `amount_refunded` on each charge,
 * which matches Stripe Dashboard → Payments and is more reliable for “was this refunded?” than
 * the hosted portal invoice list alone.
 */
export async function listPaymentActivityForCustomer(
  customerId: string,
  limit = 25
): Promise<SafePaymentActivityRow[]> {
  if (!isStripeConfigured() || !customerId) return [];
  try {
    const stripe = getStripe();
    const res = await stripe.charges.list({ customer: customerId, limit });
    return res.data.map((ch) => {
      const amount = ch.amount ?? 0;
      const amountRefunded = ch.amount_refunded ?? 0;
      const fullyRefunded = amount > 0 && amountRefunded >= amount;
      const partial = amountRefunded > 0 && !fullyRefunded;
      const statusLabel: SafePaymentActivityRow["statusLabel"] = fullyRefunded
        ? "Refunded"
        : partial
          ? "Partially refunded"
          : "Succeeded";
      return {
        id: ch.id,
        createdUnix: ch.created,
        currency: (ch.currency ?? "usd").toUpperCase(),
        amount,
        amountRefunded,
        netAfterRefunds: Math.max(0, amount - amountRefunded),
        statusLabel,
        description: ch.description ?? null,
        receiptUrl: ch.receipt_url ?? null,
      };
    });
  } catch {
    return [];
  }
}
