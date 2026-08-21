import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getStripeActiveSubscriptionSnapshot } from "@/lib/owner-economics";

describe("owner Overview/Revenue MRR source of truth", () => {
  it("both pages import and call getStripeActiveSubscriptionSnapshot (same symbol)", () => {
    const overview = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/owner/page.tsx"),
      "utf8"
    );
    const revenue = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/owner/revenue/page.tsx"),
      "utf8"
    );

    expect(overview).toContain('from "@/lib/owner-economics"');
    expect(revenue).toContain('from "@/lib/owner-economics"');
    expect(overview).toContain("getStripeActiveSubscriptionSnapshot()");
    expect(revenue).toContain("getStripeActiveSubscriptionSnapshot()");

    // Old fake formula must not return
    expect(overview).not.toContain("PRO_MONTHLY_PRICE_USD");
    expect(overview).not.toContain("payingUsers *");
  });

  it("exports a single snapshot helper used for MRR + active sub count", async () => {
    // Without Stripe keys this returns zeros — still the same function both pages call.
    const snap = await getStripeActiveSubscriptionSnapshot();
    expect(snap).toEqual(
      expect.objectContaining({
        configured: expect.any(Boolean),
        activeSubscriptionCount: expect.any(Number),
        mrrCents: expect.any(Number),
      })
    );
    expect(snap.activeSubscriptionCount).toBeGreaterThanOrEqual(0);
    expect(snap.mrrCents).toBeGreaterThanOrEqual(0);
  });
});
