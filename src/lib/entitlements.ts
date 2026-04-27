import type { User } from "@prisma/client";

export const FREE_LEAD_LIMIT = 10;
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

export function canCreateMoreLeads(leadCount: number, u: User): boolean {
  // Temporarily disabled lead limits (treat all users as unlimited).
  // When re-enabling, restore the original Free vs Pro logic.
  void leadCount;
  void u;
  return true;
}

export function mustUpgradeForProFeatures(u: User): boolean {
  return !hasProEntitlement(u);
}

export function getDailySearchLimit(u: Pick<User, "plan" | "subscriptionStatus" | "grandfatheredPro">): number {
  if (hasProEntitlement(u as User)) return PRO_SEARCHES_PER_DAY;
  return FREE_SEARCHES_PER_DAY;
}
