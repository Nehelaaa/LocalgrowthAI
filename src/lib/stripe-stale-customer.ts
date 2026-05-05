import Stripe from "stripe";
import { prisma } from "@/lib/db";

/** Stripe live vs test mismatch, deleted account, or stale DB — customer/subscription id not in this mode. */
export function isStripeResourceMissingError(e: unknown): boolean {
  return e instanceof Stripe.errors.StripeInvalidRequestError && e.code === "resource_missing";
}

/**
 * Remove Stripe linkage when IDs are invalid for the current secret (e.g. test `cus_` with `sk_live_`).
 * Preserves `grandfatheredPro` and lead/search counters.
 */
export async function clearUserStripeBilling(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionPeriodEnd: null,
      plan: "free",
    },
  });
}

/** Drop subscription fields only; keep `stripeCustomerId` when subscription id is stale. */
export async function clearUserStripeSubscription(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionPeriodEnd: null,
      plan: "free",
    },
  });
}
