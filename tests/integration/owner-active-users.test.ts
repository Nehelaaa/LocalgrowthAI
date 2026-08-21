import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { countActiveUsersSince } from "@/lib/owner-economics";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

describe("owner active users (30d) — usage-based, not User.updatedAt", () => {
  const stamp = Date.now();
  let userId: string;
  let businessId: string;
  let leadId: string;

  beforeAll(async () => {
    const email = `active-test-${stamp}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        name: "Active Test",
        plan: "pro",
        subscriptionStatus: "active",
        // Force User.updatedAt into the past so the OLD metric would miss them.
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: new Date("2025-01-01T00:00:00.000Z"),
      },
    });
    userId = user.id;

    // Prisma @updatedAt would normally bump updatedAt on any write — set via raw SQL after create.
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "updatedAt" = $1 WHERE id = $2`,
      new Date("2025-01-01T00:00:00.000Z"),
      userId
    );

    const business = await prisma.business.create({
      data: {
        placeId: `test-place-${stamp}`,
        name: "Usage Active Biz",
        address: "1 Test St",
        city: "Boston",
        state: "MA",
      },
    });
    businessId = business.id;

    const lead = await prisma.lead.create({
      data: {
        userId,
        businessId,
        leadScore: 50,
        badge: "WARM",
        contactStatus: "NOT_CONTACTED",
      },
    });
    leadId = lead.id;

    const day = new Date().toISOString().slice(0, 10);
    await prisma.searchDayUsage.create({
      data: { userId, day, count: 3 },
    });
  });

  afterAll(async () => {
    if (leadId) await prisma.lead.deleteMany({ where: { id: leadId } });
    if (businessId) await prisma.business.deleteMany({ where: { id: businessId } });
    if (userId) {
      await prisma.searchDayUsage.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  it("old User.updatedAt metric is 0 for the seeded user; usage metric counts them", async () => {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const oldStyle = await prisma.user.count({
      where: { id: userId, updatedAt: { gte: since30 } },
    });
    expect(oldStyle).toBe(0);

    const usageStyle = await countActiveUsersSince(since30);
    expect(usageStyle).toBeGreaterThanOrEqual(1);

    // Explicitly include our seeded user in the union
    const day = since30.toISOString().slice(0, 10);
    const searchHit = await prisma.searchDayUsage.findFirst({
      where: { userId, day: { gte: day } },
    });
    expect(searchHit).not.toBeNull();
  });
});
