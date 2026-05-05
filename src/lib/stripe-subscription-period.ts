import type Stripe from "stripe";

/**
 * Stripe exposes `current_period_end` on the subscription object in older responses; newer API shapes
 * often surface it only on each subscription item. Check both so billing UI stays accurate.
 */
export function extractSubscriptionCurrentPeriodEndUnix(sub: Stripe.Subscription): number | null {
  const root = sub as unknown as {
    current_period_end?: number | null;
    currentPeriodEnd?: number | null;
  };
  if (typeof root.current_period_end === "number") return root.current_period_end;
  if (typeof root.currentPeriodEnd === "number") return root.currentPeriodEnd;
  const items = sub.items?.data ?? [];
  let maxItemEnd: number | null = null;
  for (const item of items) {
    const t = item.current_period_end;
    if (typeof t === "number" && (maxItemEnd == null || t > maxItemEnd)) maxItemEnd = t;
  }
  if (maxItemEnd != null) return maxItemEnd;
  return null;
}
