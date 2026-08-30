import type { User } from "@prisma/client";
import { hasProEntitlement } from "@/lib/entitlements";

export type ConnectEntitlementUser = Pick<
  User,
  | "plan"
  | "subscriptionStatus"
  | "grandfatheredPro"
  | "stripeSubscriptionId"
  | "stripeConnectAccountId"
  | "stripeConnectChargesEnabled"
  | "stripeConnectDetailsSubmitted"
>;

/** Pro (or grandfathered) users may connect Stripe to collect invoice payments. */
export function canUseStripeConnect(u: ConnectEntitlementUser): boolean {
  return hasProEntitlement(u);
}

/** Ready to put Pay now on shared invoices. */
export function canCollectInvoicePayments(u: ConnectEntitlementUser): boolean {
  return (
    canUseStripeConnect(u) &&
    Boolean(u.stripeConnectAccountId) &&
    u.stripeConnectChargesEnabled
  );
}

export type ConnectStatusLabel =
  | "not_pro"
  | "not_connected"
  | "pending"
  | "restricted"
  | "ready";

export function connectStatusLabel(u: ConnectEntitlementUser): ConnectStatusLabel {
  if (!canUseStripeConnect(u)) return "not_pro";
  if (!u.stripeConnectAccountId) return "not_connected";
  if (u.stripeConnectChargesEnabled) return "ready";
  if (u.stripeConnectDetailsSubmitted) return "restricted";
  return "pending";
}
