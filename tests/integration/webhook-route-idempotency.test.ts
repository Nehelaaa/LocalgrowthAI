/**
 * Posts the same Stripe event.id twice through the webhook POST handler
 * (with Stripe signature + constructEvent mocked) and asserts a single OwnerBillingEvent.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

const eventId = `evt_route_idem_${Date.now()}`;
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => (name.toLowerCase() === "stripe-signature" ? "sig_test" : null),
  }),
}));

vi.mock("@/lib/analytics/posthog-server", () => ({
  captureServerEvent: vi.fn(async () => undefined),
}));

const fakeEvent = {
  id: eventId,
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_1",
      mode: "payment",
      customer: null,
      subscription: null,
    },
  },
};

vi.mock("@/lib/stripe", () => ({
  isStripeConfigured: () => true,
  stripeWebhookSecretResolved: () => "whsec_test",
  stripeWebhookSecretsResolved: () => ["whsec_test"],
  getStripe: () => ({
    webhooks: {
      constructEvent: () => fakeEvent,
    },
  }),
}));

describe("POST /api/stripe/webhook — duplicate event.id", () => {
  beforeAll(async () => {
    await prisma.ownerBillingEvent.deleteMany({ where: { stripeEventId: eventId } });
  });

  afterAll(async () => {
    await prisma.ownerBillingEvent.deleteMany({ where: { stripeEventId: eventId } });
    await prisma.$disconnect();
  });

  it("only creates one OwnerBillingEvent when the same event is posted twice", async () => {
    const { POST } = await import("@/app/api/stripe/webhook/route");

    const req1 = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "sig_test" },
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.received).toBe(true);

    const req2 = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      headers: { "stripe-signature": "sig_test" },
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.duplicate).toBe(true);

    const rows = await prisma.ownerBillingEvent.count({ where: { stripeEventId: eventId } });
    expect(rows).toBe(1);
  });
});
