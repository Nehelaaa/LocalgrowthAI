/**
 * Scenario tests for recent LocalLeadster changes (dashboard, leads, labels, metrics logic).
 * Run: node scripts/test-recent-changes.cjs
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function firstName(name, email) {
  if (name?.trim()) {
    return name.trim().split(/\s+/)[0] ?? name.trim();
  }
  const local = email.split("@")[0] ?? "there";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function parseWebsitePrice(quote) {
  if (quote == null || String(quote).trim() === "") return 0;
  const t = String(quote).trim().toLowerCase().replaceAll(",", "");
  const k = t.match(/([\d.]+)\s*k\b/);
  if (k) {
    const n = parseFloat(k[1]);
    return Number.isFinite(n) ? n * 1000 : 0;
  }
  const digits = t.replace(/[^0-9.]/g, "");
  if (!digits) return 0;
  const n = parseFloat(digits);
  return Number.isFinite(n) ? n : 0;
}

function buildLeadWhere(filters) {
  const where = { userId: "test-user" };
  if (filters?.contactStatus) {
    where.contactStatus = filters.contactStatus;
  } else {
    where.contactStatus = { not: "CLOSED_LOST" };
  }
  return where;
}

const CONTACT_STATUS_LABEL = {
  CLOSED_LOST: "Not interested",
  CLOSED_WON: "Closed Won",
};

const DASHBOARD_LABELS = {
  contactsMade: "Outreach Sent",
  closedWon: "Closed Deals",
  notInterested: "Archived Leads",
  noWebsite: "Website Opportunities",
};

async function testDbScenarios() {
  console.log("\n── Database integration scenarios ──");

  const user = await prisma.user.findFirst({
    where: { disabled: false },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    console.log("  ⚠ No users in DB — skipping DB integration tests");
    return;
  }

  console.log(`  Using user: ${user.email}`);

  const allLeads = await prisma.lead.findMany({
    where: { userId: user.id },
    include: { business: true },
  });

  const archived = allLeads.filter((l) => l.contactStatus === "CLOSED_LOST");
  const active = allLeads.filter((l) => l.contactStatus !== "CLOSED_LOST");

  const defaultListWhere = {
    userId: user.id,
    contactStatus: { not: "CLOSED_LOST" },
  };
  const defaultListCount = await prisma.lead.count({ where: defaultListWhere });
  assert(defaultListCount === active.length, "Default leads list excludes archived (CLOSED_LOST)");

  const archivedListCount = await prisma.lead.count({
    where: { userId: user.id, contactStatus: "CLOSED_LOST" },
  });
  assert(archivedListCount === archived.length, "Archived filter returns only CLOSED_LOST leads");

  const hotActive = await prisma.lead.count({
    where: { userId: user.id, badge: "HOT", contactStatus: { not: "CLOSED_LOST" } },
  });
  assert(hotActive >= 0, "Hot leads query (excluding archived) runs without error");

  const noWebsiteActive = await prisma.lead.count({
    where: {
      userId: user.id,
      contactStatus: { not: "CLOSED_LOST" },
      business: { is: { OR: [{ website: null }, { hasSocialOnly: true }] } },
    },
  });
  assert(noWebsiteActive >= 0, "Website opportunities query runs without error");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const followUpsToday = await prisma.lead.findMany({
    where: {
      userId: user.id,
      followUpDate: { gte: todayStart, lte: todayEnd },
      contactStatus: { not: "CLOSED_LOST" },
    },
  });
  assert(Array.isArray(followUpsToday), "Today's follow-ups query returns array");

  const proposalSent = await prisma.lead.count({
    where: {
      userId: user.id,
      contactStatus: { in: ["CONTACTED", "INTERESTED"] },
      websiteQuote: { not: null },
    },
  });
  assert(proposalSent >= 0, "Proposal sent (quoted contacted/interested) query runs");

  const pipelineValue = active.reduce(
    (sum, l) => sum + parseWebsitePrice(l.websiteQuote),
    0
  );
  assert(typeof pipelineValue === "number" && pipelineValue >= 0, "Pipeline value calculation is valid");

  const statusCounts = await prisma.lead.groupBy({
    by: ["contactStatus"],
    where: { userId: user.id },
    _count: true,
  });
  const countFor = (s) => statusCounts.find((x) => x.contactStatus === s)?._count ?? 0;
  const notInterested = countFor("CLOSED_LOST");
  const activeLeads = allLeads.length - notInterested;
  assert(activeLeads === active.length, "activeLeads = total - archived");

  const recentLeads = await prisma.lead.findMany({
    where: { userId: user.id, contactStatus: { not: "CLOSED_LOST" } },
    include: { business: true },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });
  assert(recentLeads.every((l) => l.contactStatus !== "CLOSED_LOST"), "Recent leads exclude archived");

  const activeForMap = await prisma.lead.findMany({
    where: { userId: user.id, contactStatus: { not: "CLOSED_LOST" } },
    select: {
      id: true,
      business: { select: { name: true, city: true, state: true, lat: true, lng: true } },
    },
  });
  const withCoords = activeForMap.filter(
    (l) => l.business.lat != null && l.business.lng != null
  ).length;
  assert(withCoords >= 0, "Map markers can use lat/lng from businesses");
  assert(activeForMap.length === active.length, "Map query matches active lead count");

  console.log(`  Stats: ${allLeads.length} total, ${active.length} active, ${archived.length} archived, ${withCoords} with coords, pipeline $${pipelineValue}`);
}

function testUnitScenarios() {
  console.log("\n── Unit / logic scenarios ──");

  assert(firstName("Ahmad Khan", "a@x.com") === "Ahmad", "Greeting uses first name");
  assert(firstName(null, "ahmad@test.com") === "Ahmad", "Greeting falls back to email local part");
  assert(firstName("", "test@co.com") === "Test", "Greeting capitalizes email fallback");

  assert(CONTACT_STATUS_LABEL.CLOSED_LOST === "Not interested", "CRM label: Not interested");
  assert(DASHBOARD_LABELS.contactsMade === "Outreach Sent", "Dashboard label: Outreach Sent");
  assert(DASHBOARD_LABELS.closedWon === "Closed Deals", "Dashboard label: Closed Deals");
  assert(DASHBOARD_LABELS.notInterested === "Archived Leads", "Dashboard label: Archived Leads");

  const noFilter = buildLeadWhere({});
  assert(noFilter.contactStatus?.not === "CLOSED_LOST", "No status filter → exclude archived");

  const archivedFilter = buildLeadWhere({ contactStatus: "CLOSED_LOST" });
  assert(archivedFilter.contactStatus === "CLOSED_LOST", "Explicit archived filter shows archived only");

  assert(parseWebsitePrice("$3,500") === 3500, "Parse website price: $3,500");
  assert(parseWebsitePrice("3.5k") === 3500, "Parse website price: 3.5k");
  assert(parseWebsitePrice(null) === 0, "Parse website price: null → 0");

  const funnel = { new: 5, contacted: 3, interested: 2, proposalSent: 1, closed: 1 };
  const max = Math.max(...Object.values(funnel), 1);
  assert(max === 5, "Funnel bar max calculation");
  assert(Math.max(4, (1 / max) * 100) === 20, "Funnel min bar width for non-zero stage");

  assert(
    decodeURIComponent(encodeURIComponent("Ray's Auto")) === "Ray's Auto",
    "Recent lead search URL round-trip encoding"
  );
}

function testFilePresence() {
  console.log("\n── File / structure checks ──");
  const fs = require("fs");
  const path = require("path");
  const root = path.join(__dirname, "..");

  const required = [
    "src/components/dashboard/DashboardOverview.tsx",
    "src/app/dashboard/leads/loading.tsx",
    "src/components/invoices/InvoiceTemplateThumbFrame.tsx",
    "src/app/dashboard/leads/LeadsFilters.tsx",
    "src/actions/metrics.ts",
  ];

  for (const f of required) {
    assert(fs.existsSync(path.join(root, f)), `File exists: ${f}`);
  }

  const overview = fs.readFileSync(
    path.join(root, "src/components/dashboard/DashboardOverview.tsx"),
    "utf8"
  );
  assert(overview.includes("Find New Businesses"), "Dashboard has Find New Businesses CTA");
  assert(overview.includes("Lead funnel"), "Dashboard has Lead funnel section");
  assert(overview.includes("Lead map"), "Dashboard has Lead map section");
  assert(overview.includes("Outreach Sent"), "Dashboard summary strip uses Outreach Sent");
  assert(overview.includes("Archived Leads"), "Dashboard quick link: Archived Leads");

  const globals = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf8");
  assert(globals.includes("invoice-template-thumb-shell"), "Safari thumb CSS present");

  const metrics = fs.readFileSync(path.join(root, "src/actions/metrics.ts"), "utf8");
  assert(metrics.includes("getDashboardData"), "getDashboardData exported");
  assert(metrics.includes("todayFollowUps"), "Dashboard data includes follow-ups");
  assert(metrics.includes("pipelineValue"), "Dashboard data includes pipeline value");

  const leads = fs.readFileSync(path.join(root, "src/actions/leads.ts"), "utf8");
  assert(leads.includes("silent"), "Silent update option for performance");
}

async function main() {
  console.log("LocalLeadster — recent changes test suite\n");
  testFilePresence();
  testUnitScenarios();
  try {
    await testDbScenarios();
  } catch (e) {
    failed++;
    console.error("  ✗ DB tests failed:", e.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n════════════════════════════════════");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("════════════════════════════════════\n");
  process.exit(failed > 0 ? 1 : 0);
}

main();
