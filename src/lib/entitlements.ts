import type { User } from "@prisma/client";

/** Free plan: max new leads ever created (deletes do not free slots). */
export const FREE_LEAD_LIMIT = 5;
/** Daily cap on Google Places *API* calls (Text Search), not cached repeats. */
export const FREE_SEARCHES_PER_DAY = 20;
export const PRO_SEARCHES_PER_DAY = 100;
export const PRO_PLAN = "pro" as const;
export const FREE_PLAN = "free" as const;

const ACTIVE = new Set([
  "active",
  "trialing",
  "past_due", // grace: keep Pro until recovery or cancel
]);

/** Full product access: legacy accounts, or paid Pro, or free trial. */
export function hasProEntitlement(
  u: Pick<User, "plan" | "subscriptionStatus" | "grandfatheredPro">
): boolean {
  if (u.grandfatheredPro) return true;
  if (u.plan !== "pro") return false;
  const s = u.subscriptionStatus;
  return s != null && ACTIVE.has(s);
}

/** @param lifetimeLeadsCreated — from `User.lifetimeLeadsCreated` (monotonic; not reduced on delete). */
export function canCreateMoreLeads(
  lifetimeLeadsCreated: number,
  u: Pick<User, "plan" | "subscriptionStatus" | "grandfatheredPro">
): boolean {
  if (hasProEntitlement(u as User)) return true;
  return lifetimeLeadsCreated < FREE_LEAD_LIMIT;
}

export function mustUpgradeForProFeatures(u: User): boolean {
  return !hasProEntitlement(u);
}

/** User already has a Stripe subscription to change in the Customer Portal, not a new Checkout. */
export function hasActiveStripeSubscription(
  u: Pick<User, "stripeSubscriptionId" | "subscriptionStatus">
): boolean {
  if (!u.stripeSubscriptionId) return false;
  const s = u.subscriptionStatus;
  return s === "active" || s === "trialing" || s === "past_due";
}

export function getDailySearchLimit(u: Pick<User, "plan" | "subscriptionStatus" | "grandfatheredPro">): number {
  if (hasProEntitlement(u as User)) return PRO_SEARCHES_PER_DAY;
  return FREE_SEARCHES_PER_DAY;
}

/** Remaining Starter lead slots (0 if at/over cap). Pro / legacy → effectively unlimited for UI. */
export function starterLeadsRemaining(
  u: Pick<User, "plan" | "subscriptionStatus" | "grandfatheredPro" | "lifetimeLeadsCreated">
): number {
  if (hasProEntitlement(u as User)) return Number.POSITIVE_INFINITY;
  return Math.max(0, FREE_LEAD_LIMIT - u.lifetimeLeadsCreated);
}
