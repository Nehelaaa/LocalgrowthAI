import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { extractSubscriptionCurrentPeriodEndUnix } from "@/lib/stripe-subscription-period";

export type SubscriptionDisplayInfo = {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date;
};

/** Live Stripe read for accurate cancel-at-period-end (webhooks may lag briefly). */
export async function getSubscriptionDisplayInfo(
  stripeSubscriptionId: string | null | undefined
): Promise<SubscriptionDisplayInfo | null> {
  if (!stripeSubscriptionId || !isStripeConfigured()) return null;
  try {
    const stripe = getStripe();
    const retrieved = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const endSec = extractSubscriptionCurrentPeriodEndUnix(retrieved);
    if (endSec == null) return null;
    return {
      cancelAtPeriodEnd: Boolean(retrieved.cancel_at_period_end),
      currentPeriodEnd: new Date(endSec * 1000),
    };
  } catch {
    return null;
  }
}
