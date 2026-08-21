import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  createOwnerBillingEvent,
  hasProcessedStripeEvent,
} from "@/lib/owner-billing-events";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

describe("Stripe webhook OwnerBillingEvent idempotency", () => {
  const eventIds: string[] = [];

  afterAll(async () => {
    if (eventIds.length) {
      await prisma.ownerBillingEvent.deleteMany({
        where: { stripeEventId: { in: eventIds } },
      });
    }
    await prisma.$disconnect();
  });

  it("createOwnerBillingEvent + hasProcessedStripeEvent reject the same event.id twice", async () => {
    const stripeEventId = `evt_test_idem_${Date.now()}`;
    eventIds.push(stripeEventId);

    const first = await createOwnerBillingEvent({
      kind: "subscription_updated",
      severity: "info",
      title: "Checkout completed (non-subscription)",
      body: "first",
      stripeEventId,
    });
    expect(first.created).toBe(true);
    expect(await hasProcessedStripeEvent(stripeEventId)).toBe(true);

    const second = await createOwnerBillingEvent({
      kind: "subscription_updated",
      severity: "info",
      title: "SHOULD NOT PERSIST",
      body: "second",
      stripeEventId,
    });
    expect(second.created).toBe(false);

    const rows = await prisma.ownerBillingEvent.count({ where: { stripeEventId } });
    expect(rows).toBe(1);
  });

  it("simulates webhook early-return: second delivery with same event.id skips create", async () => {
    const stripeEventId = `evt_test_webhook_${Date.now()}`;
    eventIds.push(stripeEventId);

    // First delivery (what the webhook does after constructEvent)
    if (await hasProcessedStripeEvent(stripeEventId)) {
      throw new Error("unexpected pre-existing event");
    }
    await createOwnerBillingEvent({
      kind: "other",
      title: "first delivery",
      stripeEventId,
    });

    // Second delivery — same check the route runs at the top of POST
    const duplicate = await hasProcessedStripeEvent(stripeEventId);
    expect(duplicate).toBe(true);
    if (!duplicate) {
      await createOwnerBillingEvent({
        kind: "other",
        title: "second delivery",
        stripeEventId,
      });
    }

    expect(await prisma.ownerBillingEvent.count({ where: { stripeEventId } })).toBe(1);
  });
});
