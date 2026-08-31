/**
 * Pure guards for invoice-share Checkout confirmation (no Prisma / Stripe SDK).
 */

export type CheckoutPaidLike = {
  payment_status?: string | null;
  status?: string | null;
};

export type CheckoutMatchLike = {
  metadata?: Record<string, string> | null;
  amount_total?: number | null;
  currency?: string | null;
};

export type ShareMatchLike = {
  id: string;
  token: string;
  amountCents: number | null;
  currency: string | null;
};

/** True when Checkout reports a successful payment (webhook or return URL). */
export function invoiceShareCheckoutLooksPaid(session: CheckoutPaidLike): boolean {
  return session.payment_status === "paid" || session.status === "complete";
}

/**
 * Defense-in-depth: session metadata + amount must match the stored share.
 */
export function invoiceShareCheckoutMatchesShare(
  session: CheckoutMatchLike,
  share: ShareMatchLike,
  opts?: { expectedToken?: string }
): boolean {
  const kind = session.metadata?.kind?.trim();
  if (kind && kind !== "invoice_share_payment") return false;

  const metaToken = session.metadata?.invoiceShareToken?.trim();
  const metaId = session.metadata?.invoiceShareId?.trim();
  if (!metaToken && !metaId) return false;
  if (metaToken && metaToken !== share.token) return false;
  if (metaId && metaId !== share.id) return false;
  if (opts?.expectedToken && metaToken !== opts.expectedToken) return false;
  if (opts?.expectedToken && share.token !== opts.expectedToken) return false;

  if (
    typeof session.amount_total === "number" &&
    share.amountCents != null &&
    session.amount_total !== share.amountCents
  ) {
    return false;
  }

  if (session.currency && share.currency) {
    if (session.currency.toLowerCase() !== share.currency.toLowerCase()) {
      return false;
    }
  }

  return true;
}
