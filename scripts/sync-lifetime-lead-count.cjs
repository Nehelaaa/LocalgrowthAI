/**
 * One-time after adding `User.lifetimeLeadsCreated`: set it from current Lead rows
 * (best-effort; true "lifetime" after deletes is not recoverable from DB).
 *
 * Usage: node scripts/sync-lifetime-lead-count.cjs
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`
    UPDATE "User" u
    SET "lifetimeLeadsCreated" = (
      SELECT COUNT(*)::int FROM "Lead" l WHERE l."userId" = u.id
    )
  `;
  console.log("User.lifetimeLeadsCreated synced from Lead counts.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
