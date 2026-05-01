import type { User } from "@prisma/client";

/** Free plan: max new leads ever created (deletes do not free slots). */
export const FREE_LEAD_LIMIT = 5;
/** Starter: lifetime cap on live Google Places searches (cache hits never consume). */
export const FREE_SEARCHES_LIFETIME = 10;
/** Pro: daily cap on live Google Places searches. */
export const PRO_SEARCHES_PER_DAY = 100;
export const PRO_PLAN = "pro" as const;
export const FREE_PLAN = "free" as const;

const ACTIVE = new Set([
  "active",
  "trialing",
  "past_due", // grace: keep Pro until recovery or cancel
]);

type ProEntitlementUser = Pick<User, "plan" | "subscriptionStatus" | "grandfatheredPro"> & {
  stripeSubscriptionId?: string | null;
};

/** Full product access: legacy accounts, or paid Pro, or free trial. */
export function hasProEntitlement(u: ProEntitlementUser): boolean {
  if (u.grandfatheredPro) return true;

  const s = u.subscriptionStatus ?? null;

  // Paying Stripe subscription on file (handles `plan` still "free" until webhooks/sync finish).
  if (u.stripeSubscriptionId && s != null && ACTIVE.has(s)) return true;

  if (u.plan !== "pro") return false;

  // Plan already flipped to Pro but Stripe status not written yet (webhook lag).
  if (s == null || s === "") return true;

  if (s === "canceled" || s === "unpaid" || s === "incomplete_expired" || s === "incomplete") {
    return false;
  }

  return ACTIVE.has(s);
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

/** Live Google search quota: Starter = lifetime total; Pro = per UTC day (enforced via SearchDayUsage). */
export function getSearchQuotaLimit(
  u: Pick<User, "plan" | "subscriptionStatus" | "grandfatheredPro">
): number {
  if (hasProEntitlement(u as User)) return PRO_SEARCHES_PER_DAY;
  return FREE_SEARCHES_LIFETIME;
}

export function isStarterSearchQuotaLifetime(
  u: Pick<User, "plan" | "subscriptionStatus" | "grandfatheredPro">
): boolean {
  return !hasProEntitlement(u as User);
}

/** Remaining Starter lead slots (0 if at/over cap). Pro / legacy → effectively unlimited for UI. */
export function starterLeadsRemaining(
  u: Pick<User, "plan" | "subscriptionStatus" | "grandfatheredPro" | "lifetimeLeadsCreated">
): number {
  if (hasProEntitlement(u as User)) return Number.POSITIVE_INFINITY;
  return Math.max(0, FREE_LEAD_LIMIT - u.lifetimeLeadsCreated);
}
