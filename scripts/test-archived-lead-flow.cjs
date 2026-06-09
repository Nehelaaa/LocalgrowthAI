/**
 * Simulates archived-lead workflow: mark lead CLOSED_LOST, verify list exclusion, restore.
 * Run: node scripts/test-archived-lead-flow.cjs
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { disabled: false } });
  if (!user) {
    console.log("No user — skip");
    process.exit(0);
  }

  const lead = await prisma.lead.findFirst({
    where: { userId: user.id, contactStatus: { not: "CLOSED_LOST" } },
    include: { business: true },
  });
  if (!lead) {
    console.log("No active lead to test — skip");
    process.exit(0);
  }

  const prev = lead.contactStatus;
  console.log(`Testing lead: ${lead.business.name} (${prev})`);

  await prisma.lead.update({
    where: { id: lead.id },
    data: { contactStatus: "CLOSED_LOST" },
  });

  const inDefaultList = await prisma.lead.count({
    where: { id: lead.id, userId: user.id, contactStatus: { not: "CLOSED_LOST" } },
  });
  const inArchivedList = await prisma.lead.count({
    where: { id: lead.id, userId: user.id, contactStatus: "CLOSED_LOST" },
  });

  if (inDefaultList !== 0 || inArchivedList !== 1) {
    console.error("FAIL: archived lead visibility wrong", { inDefaultList, inArchivedList });
    process.exit(1);
  }
  console.log("✓ Lead hidden from default list when marked Not interested");

  await prisma.lead.update({
    where: { id: lead.id },
    data: { contactStatus: prev },
  });

  const restored = await prisma.lead.count({
    where: { id: lead.id, userId: user.id, contactStatus: { not: "CLOSED_LOST" } },
  });
  if (restored !== 1) {
    console.error("FAIL: could not restore lead status");
    process.exit(1);
  }
  console.log("✓ Lead restored to original status:", prev);
  console.log("\nArchived lead flow: PASS");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
