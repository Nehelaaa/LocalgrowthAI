import { describe, expect, it } from "vitest";
import {
  FREE_LEAD_LIMIT,
  FREE_SEARCHES_LIFETIME,
  PRO_SEARCHES_PER_DAY,
  canCreateMoreLeads,
  getSearchQuotaLimit,
  hasProEntitlement,
  starterLeadsRemaining,
} from "@/lib/entitlements";

const base = {
  plan: "free" as const,
  subscriptionStatus: null as string | null,
  grandfatheredPro: false,
};

describe("hasProEntitlement", () => {
  it("returns true for grandfathered accounts regardless of plan", () => {
    expect(hasProEntitlement({ ...base, grandfatheredPro: true })).toBe(true);
    expect(
      hasProEntitlement({
        ...base,
        plan: "free",
        subscriptionStatus: "canceled",
        grandfatheredPro: true,
      })
    ).toBe(true);
  });

  it("returns true when stripeSubscriptionId is set with active/trialing/past_due", () => {
    expect(
      hasProEntitlement({
        ...base,
        plan: "free",
        stripeSubscriptionId: "sub_x",
        subscriptionStatus: "active",
      })
    ).toBe(true);
    expect(
      hasProEntitlement({
        ...base,
        plan: "free",
        stripeSubscriptionId: "sub_x",
        subscriptionStatus: "trialing",
      })
    ).toBe(true);
    expect(
      hasProEntitlement({
        ...base,
        plan: "free",
        stripeSubscriptionId: "sub_x",
        subscriptionStatus: "past_due",
      })
    ).toBe(true);
  });

  it("returns false when stripe sub exists but status is canceled/unpaid", () => {
    expect(
      hasProEntitlement({
        ...base,
        stripeSubscriptionId: "sub_x",
        subscriptionStatus: "canceled",
      })
    ).toBe(false);
  });

  it("treats plan=pro with null/empty status as entitled (webhook lag)", () => {
    expect(hasProEntitlement({ ...base, plan: "pro", subscriptionStatus: null })).toBe(true);
    expect(hasProEntitlement({ ...base, plan: "pro", subscriptionStatus: "" })).toBe(true);
  });

  it("denies plan=pro when status is canceled/unpaid/incomplete*", () => {
    for (const subscriptionStatus of [
      "canceled",
      "unpaid",
      "incomplete",
      "incomplete_expired",
    ]) {
      expect(hasProEntitlement({ ...base, plan: "pro", subscriptionStatus })).toBe(false);
    }
  });

  it("allows plan=pro with active/trialing/past_due", () => {
    for (const subscriptionStatus of ["active", "trialing", "past_due"]) {
      expect(hasProEntitlement({ ...base, plan: "pro", subscriptionStatus })).toBe(true);
    }
  });

  it("returns false for free plan with no stripe sub", () => {
    expect(hasProEntitlement(base)).toBe(false);
  });
});

describe("canCreateMoreLeads / starterLeadsRemaining", () => {
  it("allows unlimited creates for Pro", () => {
    expect(canCreateMoreLeads(999, { ...base, plan: "pro", subscriptionStatus: "active" })).toBe(
      true
    );
    expect(
      starterLeadsRemaining({
        ...base,
        plan: "pro",
        subscriptionStatus: "active",
        lifetimeLeadsCreated: 999,
      })
    ).toBe(Number.POSITIVE_INFINITY);
  });

  it("enforces FREE_LEAD_LIMIT for free users", () => {
    expect(canCreateMoreLeads(FREE_LEAD_LIMIT - 1, base)).toBe(true);
    expect(canCreateMoreLeads(FREE_LEAD_LIMIT, base)).toBe(false);
    expect(canCreateMoreLeads(FREE_LEAD_LIMIT + 1, base)).toBe(false);
    expect(starterLeadsRemaining({ ...base, lifetimeLeadsCreated: 0 })).toBe(FREE_LEAD_LIMIT);
    expect(starterLeadsRemaining({ ...base, lifetimeLeadsCreated: FREE_LEAD_LIMIT })).toBe(0);
    expect(starterLeadsRemaining({ ...base, lifetimeLeadsCreated: FREE_LEAD_LIMIT + 3 })).toBe(0);
  });
});

describe("getSearchQuotaLimit", () => {
  it("returns daily Pro cap vs lifetime free cap", () => {
    expect(getSearchQuotaLimit({ ...base, plan: "pro", subscriptionStatus: "active" })).toBe(
      PRO_SEARCHES_PER_DAY
    );
    expect(getSearchQuotaLimit(base)).toBe(FREE_SEARCHES_LIFETIME);
    expect(getSearchQuotaLimit({ ...base, grandfatheredPro: true })).toBe(PRO_SEARCHES_PER_DAY);
  });
});
