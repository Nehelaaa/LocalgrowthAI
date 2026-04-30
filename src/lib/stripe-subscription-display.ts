import { getStripe, isStripeConfigured } from "@/lib/stripe";

export type SubscriptionDisplayInfo = {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date;
};

type SubscriptionWithPeriod = {
  cancel_at_period_end?: boolean | null;
  current_period_end?: number;
};

function periodEndSeconds(sub: SubscriptionWithPeriod): number | null {
  const n = sub.current_period_end;
  return typeof n === "number" ? n : null;
}

/** Live Stripe read for accurate cancel-at-period-end (webhooks may lag briefly). */
export async function getSubscriptionDisplayInfo(
  stripeSubscriptionId: string | null | undefined
): Promise<SubscriptionDisplayInfo | null> {
  if (!stripeSubscriptionId || !isStripeConfigured()) return null;
  try {
    const stripe = getStripe();
    const retrieved = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const sub = retrieved as unknown as SubscriptionWithPeriod;
    const endSec = periodEndSeconds(sub);
    if (endSec == null) return null;
    return {
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      currentPeriodEnd: new Date(endSec * 1000),
    };
  } catch {
    return null;
  }
}
