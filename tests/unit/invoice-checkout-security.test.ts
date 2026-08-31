import { describe, expect, it } from "vitest";
import {
  invoiceShareCheckoutLooksPaid,
  invoiceShareCheckoutMatchesShare,
} from "@/lib/invoice-checkout-security";
import { collectAllowedOrigins, decideSameOrigin } from "@/lib/same-origin";

describe("checkout payment binding (security)", () => {
  const share = {
    id: "shr_1",
    token: "tok_abc12345",
    amountCents: 5000,
    currency: "usd",
  };

  it("requires paid/complete session", () => {
    expect(
      invoiceShareCheckoutLooksPaid({
        payment_status: "unpaid",
        status: "open",
      })
    ).toBe(false);
    expect(
      invoiceShareCheckoutLooksPaid({
        payment_status: "paid",
        status: "complete",
      })
    ).toBe(true);
  });

  it("rejects amount or token mismatch", () => {
    const base = {
      metadata: {
        kind: "invoice_share_payment",
        invoiceShareToken: share.token,
        invoiceShareId: share.id,
      },
      amount_total: 5000,
      currency: "usd",
    };
    expect(invoiceShareCheckoutMatchesShare(base, share)).toBe(true);
    expect(
      invoiceShareCheckoutMatchesShare({ ...base, amount_total: 1 }, share)
    ).toBe(false);
    expect(
      invoiceShareCheckoutMatchesShare(
        {
          ...base,
          metadata: { ...base.metadata, invoiceShareToken: "other" },
        },
        share
      )
    ).toBe(false);
    expect(
      invoiceShareCheckoutMatchesShare(base, share, { expectedToken: "wrong" })
    ).toBe(false);
    expect(
      invoiceShareCheckoutMatchesShare(base, share, {
        expectedToken: share.token,
      })
    ).toBe(true);
  });

  it("rejects missing metadata", () => {
    expect(
      invoiceShareCheckoutMatchesShare(
        { metadata: {}, amount_total: 5000, currency: "usd" },
        share
      )
    ).toBe(false);
  });
});

describe("same-origin CSRF decision", () => {
  const base = {
    requestOrigin: "https://localleadster.com",
  };

  it("allows matching Origin", () => {
    expect(
      decideSameOrigin({
        ...base,
        originHeader: "https://localleadster.com",
      })
    ).toBe("allow");
  });

  it("rejects foreign Origin", () => {
    expect(
      decideSameOrigin({
        ...base,
        originHeader: "https://evil.example",
      })
    ).toBe("deny");
  });

  it("rejects cross-site Sec-Fetch-Site when Origin absent", () => {
    expect(
      decideSameOrigin({
        ...base,
        secFetchSite: "cross-site",
      })
    ).toBe("deny");
  });

  it("rejects foreign Referer when Origin absent", () => {
    expect(
      decideSameOrigin({
        ...base,
        refererHeader: "https://evil.example/attack",
      })
    ).toBe("deny");
  });

  it("allows www/apex pairs", () => {
    const set = collectAllowedOrigins({
      requestOrigin: "https://localleadster.com",
    });
    expect(set.has("https://localleadster.com")).toBe(true);
    expect(set.has("https://www.localleadster.com")).toBe(true);
  });
});
