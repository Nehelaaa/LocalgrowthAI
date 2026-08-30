import { invoiceTotals, type InvoiceSnapshot } from "@/lib/invoice-types";

/** Stripe card minimum for USD (and most currencies) is 50 cents. */
export const STRIPE_MIN_CHARGE_CENTS = 50;

/** Convert major currency units (e.g. 12.34 USD) to Stripe minor units. */
export function dollarsToStripeCents(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount * 100);
}

export function invoiceSnapshotAmountCents(
  snapshot: Pick<InvoiceSnapshot, "lineItems" | "taxPercent" | "discountAmount">
): number {
  return dollarsToStripeCents(invoiceTotals(snapshot).total);
}

/**
 * Platform application fee in cents from basis points (100 bps = 1%).
 * Env: STRIPE_CONNECT_APPLICATION_FEE_BPS (0–1000). Default 0.
 */
export function connectApplicationFeeCents(amountCents: number): number {
  const raw = process.env.STRIPE_CONNECT_APPLICATION_FEE_BPS?.trim();
  if (!raw) return 0;
  const bps = Number.parseInt(raw, 10);
  if (!Number.isFinite(bps) || bps <= 0) return 0;
  const capped = Math.min(1000, bps);
  const fee = Math.floor((amountCents * capped) / 10_000);
  // Leave at least the Stripe minimum for the connected account when possible.
  if (amountCents <= STRIPE_MIN_CHARGE_CENTS) return 0;
  return Math.min(fee, amountCents - STRIPE_MIN_CHARGE_CENTS);
}

export function canOfferInvoiceCheckout(amountCents: number): boolean {
  return amountCents >= STRIPE_MIN_CHARGE_CENTS;
}

export function publicPaymentState(opts: {
  paymentStatus: string;
  amountCents: number | null;
  sellerReady: boolean;
}): {
  canPay: boolean;
  status: "unpayable" | "unpaid" | "paid" | "refunded";
  amountCents: number | null;
} {
  const status = (["unpayable", "unpaid", "paid", "refunded"].includes(
    opts.paymentStatus
  )
    ? opts.paymentStatus
    : "unpayable") as "unpayable" | "unpaid" | "paid" | "refunded";

  const canPay =
    status === "unpaid" &&
    opts.sellerReady &&
    opts.amountCents != null &&
    canOfferInvoiceCheckout(opts.amountCents);

  return { canPay, status, amountCents: opts.amountCents };
}

