/**
 * One-time data backfill for SaaS multi-tenancy.
 * - Assigns existing leads to the first user in the database (oldest by createdAt).
 * - Preserves access for all accounts that already exist: full Pro (grandfathered).
 * Safe to re-run: only updates null userId and only sets grandfather for users not yet upgraded.
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Capture any account that already exists (before this script alters the DB) for grandfathering.
  const legacyUserIds = (await prisma.user.findMany({ select: { id: true } })).map(
    (u) => u.id
  );

  const first = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (first) {
    const r = await prisma.$executeRaw`
      UPDATE Lead SET userId = ${first.id} WHERE userId IS NULL
    `;
    console.log("Leads linked to first user rows affected:", r);
  } else {
    console.log("No users yet; orphan leads stay unassigned until first signup.");
  }

  if (legacyUserIds.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: legacyUserIds } },
      data: {
        grandfatheredPro: true,
        plan: "pro",
        subscriptionStatus: "active",
        onboardingComplete: true,
      },
    });
  }
  console.log(
    "SaaS backfill done: " +
      legacyUserIds.length +
      " existing account(s) keep full Pro access; future signups are on the Free/Stripe path."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
