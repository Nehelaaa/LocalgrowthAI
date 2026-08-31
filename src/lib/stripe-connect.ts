import type { User } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import {
  canCollectInvoicePayments,
  canUseStripeConnect,
} from "@/lib/stripe-connect-entitlements";
import { connectApplicationFeeCents, canOfferInvoiceCheckout } from "@/lib/invoice-payment-money";
import {
  invoiceShareCheckoutLooksPaid,
  invoiceShareCheckoutMatchesShare,
} from "@/lib/invoice-checkout-security";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { defaultInvoiceCompanyName } from "@/lib/invoice-branding";
import type { InvoiceSnapshot } from "@/lib/invoice-types";
import { invoiceSnapshotShareSchema, toPublicInvoiceSnapshot } from "@/lib/invoice-share";

export {
  invoiceShareCheckoutLooksPaid,
  invoiceShareCheckoutMatchesShare,
} from "@/lib/invoice-checkout-security";

export function connectCountryCode(): string {
  const c = process.env.STRIPE_CONNECT_DEFAULT_COUNTRY?.trim().toUpperCase();
  if (c && /^[A-Z]{2}$/.test(c)) return c;
  return "US";
}

export type ConnectAccountFlags = {
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
};

export function flagsFromStripeAccount(account: Stripe.Account): ConnectAccountFlags {
  return {
    detailsSubmitted: Boolean(account.details_submitted),
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
  };
}

export async function persistConnectAccountFlags(
  userId: string,
  accountId: string,
  flags: ConnectAccountFlags
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeConnectAccountId: accountId,
      stripeConnectDetailsSubmitted: flags.detailsSubmitted,
      stripeConnectChargesEnabled: flags.chargesEnabled,
      stripeConnectPayoutsEnabled: flags.payoutsEnabled,
      ...(flags.chargesEnabled
        ? { stripeConnectOnboardedAt: new Date() }
        : {}),
    },
  });
}

export async function syncConnectAccountFromStripe(userId: string): Promise<User | null> {
  if (!isStripeConfigured()) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeConnectAccountId) return user;

  const stripe = getStripe();
  try {
    const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
    const flags = flagsFromStripeAccount(account);
    await persistConnectAccountFlags(userId, account.id, flags);
    return prisma.user.findUnique({ where: { id: userId } });
  } catch (e) {
    console.error("[stripe-connect] syncConnectAccountFromStripe", e);
    return user;
  }
}

export async function ensureConnectExpressAccount(user: User): Promise<string> {
  if (!canUseStripeConnect(user)) {
    throw new Error("PRO_REQUIRED");
  }
  if (!isStripeConfigured()) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  if (user.stripeConnectAccountId) {
    return user.stripeConnectAccountId;
  }

  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    country: connectCountryCode(),
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: "individual",
    metadata: { platformUserId: user.id },
  });

  const flags = flagsFromStripeAccount(account);
  await persistConnectAccountFlags(user.id, account.id, flags);
  return account.id;
}

export async function createConnectAccountOnboardingLink(opts: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accountLinks.create({
    account: opts.accountId,
    refresh_url: opts.refreshUrl,
    return_url: opts.returnUrl,
    type: "account_onboarding",
  });
  if (!link.url) throw new Error("No onboarding URL from Stripe");
  return link.url;
}

export async function createConnectExpressDashboardLink(
  accountId: string
): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accounts.createLoginLink(accountId);
  if (!link.url) throw new Error("No Express dashboard URL from Stripe");
  return link.url;
}

/** Clear local Connect linkage (does not delete the Stripe account). */
export async function disconnectConnectAccount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeConnectAccountId: null,
      stripeConnectDetailsSubmitted: false,
      stripeConnectChargesEnabled: false,
      stripeConnectPayoutsEnabled: false,
      stripeConnectOnboardedAt: null,
    },
  });
}

export async function applyConnectAccountUpdated(
  account: Stripe.Account
): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { stripeConnectAccountId: account.id },
    select: { id: true },
  });
  if (!user) {
    const platformUserId = account.metadata?.platformUserId;
    if (!platformUserId) return null;
    const byMeta = await prisma.user.findUnique({
      where: { id: platformUserId },
      select: { id: true },
    });
    if (!byMeta) return null;
    const flags = flagsFromStripeAccount(account);
    await persistConnectAccountFlags(byMeta.id, account.id, flags);
    return byMeta.id;
  }
  const flags = flagsFromStripeAccount(account);
  await persistConnectAccountFlags(user.id, account.id, flags);
  return user.id;
}

export async function createInvoiceShareCheckoutSession(opts: {
  shareToken: string;
  origin: string;
}): Promise<{ url: string; sessionId: string }> {
  if (!isStripeConfigured()) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  const share = await prisma.invoiceShare.findUnique({
    where: { token: opts.shareToken },
    include: {
      user: true,
    },
  });
  if (!share) throw new Error("NOT_FOUND");
  if (share.expiresAt && share.expiresAt.getTime() < Date.now()) {
    throw new Error("EXPIRED");
  }
  if (share.paymentStatus === "paid") {
    throw new Error("ALREADY_PAID");
  }
  if (share.paymentStatus === "refunded") {
    throw new Error("REFUNDED");
  }
  if (share.paymentStatus !== "unpaid" || !share.amountCents) {
    throw new Error("NOT_PAYABLE");
  }
  if (!canOfferInvoiceCheckout(share.amountCents)) {
    throw new Error("AMOUNT_TOO_LOW");
  }
  if (!canCollectInvoicePayments(share.user)) {
    throw new Error("SELLER_NOT_READY");
  }

  const accountId = share.user.stripeConnectAccountId!;
  const parsed = invoiceSnapshotShareSchema.safeParse(share.snapshot);
  if (!parsed.success) throw new Error("INVALID_SNAPSHOT");
  const snapshot = toPublicInvoiceSnapshot(parsed.data);
  const business =
    snapshot.senderBusinessName?.trim() || defaultInvoiceCompanyName();
  const currency = (share.currency || "usd").toLowerCase();
  const fee = connectApplicationFeeCents(share.amountCents);

  const stripe = getStripe();

  // Reuse open session if still unpaid and valid.
  if (share.stripeCheckoutSessionId) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(
        share.stripeCheckoutSessionId,
        undefined,
        { stripeAccount: accountId }
      );
      if (
        existing.status === "open" &&
        existing.url &&
        existing.payment_status !== "paid"
      ) {
        return { url: existing.url, sessionId: existing.id };
      }
    } catch {
      /* create a new session */
    }
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: share.amountCents,
          product_data: {
            name: `Invoice ${snapshot.invoiceNumber}`,
            description: `Payment to ${business}`.slice(0, 500),
          },
        },
      },
    ],
    success_url: `${opts.origin}/i/${share.token}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.origin}/i/${share.token}?canceled=1`,
    customer_email: undefined,
    billing_address_collection: "auto",
    metadata: {
      invoiceShareId: share.id,
      invoiceShareToken: share.token,
      platformUserId: share.userId,
      kind: "invoice_share_payment",
    },
    payment_intent_data: {
      metadata: {
        invoiceShareId: share.id,
        invoiceShareToken: share.token,
        platformUserId: share.userId,
        kind: "invoice_share_payment",
      },
      ...(fee > 0 ? { application_fee_amount: fee } : {}),
    },
  };

  const session = await stripe.checkout.sessions.create(sessionParams, {
    stripeAccount: accountId,
  });

  if (!session.url) throw new Error("NO_CHECKOUT_URL");

  await prisma.invoiceShare.update({
    where: { id: share.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  return { url: session.url, sessionId: session.id };
}

export async function markInvoiceSharePaidFromCheckout(
  session: Stripe.Checkout.Session,
  opts?: { expectedToken?: string }
): Promise<{ shareId: string; userId: string } | null> {
  if (!invoiceShareCheckoutLooksPaid(session)) return null;

  const token = session.metadata?.invoiceShareToken?.trim();
  const shareId = session.metadata?.invoiceShareId?.trim();
  const kind = session.metadata?.kind?.trim();

  if (kind && kind !== "invoice_share_payment") return null;
  if (!token && !shareId) return null;
  if (opts?.expectedToken && token !== opts.expectedToken) return null;

  const share = shareId
    ? await prisma.invoiceShare.findUnique({ where: { id: shareId } })
    : token
      ? await prisma.invoiceShare.findUnique({ where: { token } })
      : null;

  if (!share) return null;
  if (!invoiceShareCheckoutMatchesShare(session, share, opts)) return null;

  // Already paid — idempotent success.
  if (share.paymentStatus === "paid") {
    return { shareId: share.id, userId: share.userId };
  }
  // Do not resurrect refunded invoices from a stale checkout return.
  if (share.paymentStatus === "refunded") return null;
  if (share.paymentStatus !== "unpaid") return null;

  const pi =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  await prisma.invoiceShare.update({
    where: { id: share.id },
    data: {
      paymentStatus: "paid",
      paidAt: share.paidAt ?? new Date(),
      stripeCheckoutSessionId: session.id,
      ...(pi ? { stripePaymentIntentId: pi } : {}),
    },
  });

  return { shareId: share.id, userId: share.userId };
}

export async function markInvoiceShareRefundedFromPaymentIntent(
  paymentIntentId: string
): Promise<boolean> {
  const updated = await prisma.invoiceShare.updateMany({
    where: {
      stripePaymentIntentId: paymentIntentId,
      paymentStatus: "paid",
    },
    data: { paymentStatus: "refunded" },
  });
  return updated.count > 0;
}

/** Snapshot type helper for product description lines. */
export type { InvoiceSnapshot };
