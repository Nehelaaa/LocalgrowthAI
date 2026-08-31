import { describe, expect, it } from "vitest";
import {
  canOfferInvoiceCheckout,
  connectApplicationFeeCents,
  dollarsToStripeCents,
  invoiceSnapshotAmountCents,
  publicPaymentState,
  STRIPE_MIN_CHARGE_CENTS,
} from "@/lib/invoice-payment-money";
import {
  canCollectInvoicePayments,
  canUseStripeConnect,
  connectStatusLabel,
} from "@/lib/stripe-connect-entitlements";
import { buildInvoiceSmsBody } from "@/lib/invoice-sms";

describe("invoice payment money", () => {
  it("converts dollars to cents safely", () => {
    expect(dollarsToStripeCents(10)).toBe(1000);
    expect(dollarsToStripeCents(10.55)).toBe(1055);
    expect(dollarsToStripeCents(0)).toBe(0);
    expect(dollarsToStripeCents(-1)).toBe(0);
  });

  it("totals invoice snapshot into cents", () => {
    expect(
      invoiceSnapshotAmountCents({
        lineItems: [
          { id: "1", description: "A", amount: 100 },
          { id: "2", description: "B", amount: 50 },
        ],
        taxPercent: 10,
        discountAmount: 20,
      })
    ).toBe(14300); // (150-20)*1.1 = 143
  });

  it("enforces Stripe minimum", () => {
    expect(canOfferInvoiceCheckout(STRIPE_MIN_CHARGE_CENTS)).toBe(true);
    expect(canOfferInvoiceCheckout(STRIPE_MIN_CHARGE_CENTS - 1)).toBe(false);
  });

  it("computes application fee from bps env", () => {
    const prev = process.env.STRIPE_CONNECT_APPLICATION_FEE_BPS;
    process.env.STRIPE_CONNECT_APPLICATION_FEE_BPS = "100"; // 1%
    expect(connectApplicationFeeCents(10_000)).toBe(100);
    process.env.STRIPE_CONNECT_APPLICATION_FEE_BPS = "0";
    expect(connectApplicationFeeCents(10_000)).toBe(0);
    if (prev === undefined) delete process.env.STRIPE_CONNECT_APPLICATION_FEE_BPS;
    else process.env.STRIPE_CONNECT_APPLICATION_FEE_BPS = prev;
  });

  it("exposes public pay state", () => {
    expect(
      publicPaymentState({
        paymentStatus: "unpaid",
        amountCents: 5000,
        sellerReady: true,
      }).canPay
    ).toBe(true);
    expect(
      publicPaymentState({
        paymentStatus: "paid",
        amountCents: 5000,
        sellerReady: true,
      }).canPay
    ).toBe(false);
  });
});

describe("stripe connect entitlements", () => {
  const base = {
    plan: "pro",
    subscriptionStatus: "active",
    grandfatheredPro: false,
    stripeSubscriptionId: "sub_x",
    stripeConnectAccountId: null as string | null,
    stripeConnectChargesEnabled: false,
    stripeConnectDetailsSubmitted: false,
  };

  it("requires Pro to use Connect", () => {
    expect(canUseStripeConnect({ ...base, plan: "free", stripeSubscriptionId: null, subscriptionStatus: null })).toBe(
      false
    );
    expect(canUseStripeConnect(base)).toBe(true);
  });

  it("requires charges enabled to collect", () => {
    expect(canCollectInvoicePayments(base)).toBe(false);
    expect(
      canCollectInvoicePayments({
        ...base,
        stripeConnectAccountId: "acct_1",
        stripeConnectChargesEnabled: true,
      })
    ).toBe(true);
  });

  it("labels connect status", () => {
    expect(connectStatusLabel(base)).toBe("not_connected");
    expect(
      connectStatusLabel({
        ...base,
        stripeConnectAccountId: "acct_1",
        stripeConnectDetailsSubmitted: true,
      })
    ).toBe("restricted");
    expect(
      connectStatusLabel({
        ...base,
        stripeConnectAccountId: "acct_1",
        stripeConnectChargesEnabled: true,
      })
    ).toBe("ready");
  });
});

describe("Managed Risk account flag", () => {
  it("defaults off so production stays on classic Express", async () => {
    const prev = process.env.STRIPE_CONNECT_MANAGED_RISK_ACCOUNTS;
    delete process.env.STRIPE_CONNECT_MANAGED_RISK_ACCOUNTS;
    const { connectManagedRiskAccountsEnabled } = await import(
      "@/lib/stripe-connect-managed-risk"
    );
    expect(connectManagedRiskAccountsEnabled()).toBe(false);
    process.env.STRIPE_CONNECT_MANAGED_RISK_ACCOUNTS = "1";
    expect(connectManagedRiskAccountsEnabled()).toBe(true);
    process.env.STRIPE_CONNECT_MANAGED_RISK_ACCOUNTS = "true";
    expect(connectManagedRiskAccountsEnabled()).toBe(true);
    process.env.STRIPE_CONNECT_MANAGED_RISK_ACCOUNTS = "0";
    expect(connectManagedRiskAccountsEnabled()).toBe(false);
    if (prev === undefined) delete process.env.STRIPE_CONNECT_MANAGED_RISK_ACCOUNTS;
    else process.env.STRIPE_CONNECT_MANAGED_RISK_ACCOUNTS = prev;
  });
});

describe("invoice SMS with payments", () => {
  it("mentions pay when enabled", () => {
    const body = buildInvoiceSmsBody({
      businessName: "Acme",
      invoiceNumber: "INV-1",
      viewUrl: "https://example.com/i/x",
      paymentsEnabled: true,
    });
    expect(body.toLowerCase()).toContain("pay");
    expect(body).toContain("https://example.com/i/x");
  });
});
