import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

const PRO_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"]);

/** Maps a Stripe subscription row to User billing fields (matches webhook logic). */
export function subscriptionToUserData(sub: Stripe.Subscription) {
  const isPro = PRO_STATUSES.has(sub.status);
  const cpe = (sub as unknown as { current_period_end?: number }).current_period_end;
  return {
    stripeSubscriptionId: sub.id,
    subscriptionStatus: sub.status,
    plan: isPro ? ("pro" as const) : ("free" as const),
    subscriptionPeriodEnd: typeof cpe === "number" ? new Date(cpe * 1000) : null,
  };
}

/**
 * Pull the latest paying subscription from Stripe and persist it on the user.
 * Used after Checkout success (webhooks can lag) and as a backup in invoice webhooks.
 */
export async function syncUserSubscriptionFromStripe(userId: string): Promise<boolean> {
  if (!isStripeConfigured()) return false;

  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u?.stripeCustomerId) return false;

  const stripe = getStripe();

  if (u.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(u.stripeSubscriptionId);
      if (PRO_STATUSES.has(sub.status)) {
        await prisma.user.update({ where: { id: userId }, data: subscriptionToUserData(sub) });
        return true;
      }
    } catch {
      // fall through to list
    }
  }

  const list = await stripe.subscriptions.list({
    customer: u.stripeCustomerId,
    status: "all",
    limit: 20,
  });

  const paying = list.data.filter((s) => PRO_STATUSES.has(s.status));
  if (paying.length === 0) return false;

  paying.sort(
    (a, b) =>
      ((b as unknown as { current_period_end?: number }).current_period_end ?? 0) -
      ((a as unknown as { current_period_end?: number }).current_period_end ?? 0)
  );
  const best = paying[0]!;
  await prisma.user.update({ where: { id: userId }, data: subscriptionToUserData(best) });
  return true;
}
