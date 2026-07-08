require("dotenv").config({ path: ".env.local" });
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

function normalizeCityName(city) {
  if (!city) return null;
  const trimmed = city.trim();
  if (!trimmed) return null;
  if (/^\d+\s/.test(trimmed)) return null;
  if (/\b(floor|suite|ste|unit|apt|building|bldg|#)\b/i.test(trimmed)) return null;
  if (/\b\d+(st|nd|rd|th)\b/i.test(trimmed)) return null;
  if (
    /\d/.test(trimmed) &&
    /\b(st|street|ste|suite|ave|avenue|rd|road|blvd|dr|drive|ln|lane|way|ct|court|pl|place)\b/i.test(
      trimmed
    )
  ) {
    return null;
  }
  return trimmed;
}

function extractCityState(formattedAddress) {
  let parts = formattedAddress
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return {};

  const lastLower = parts[parts.length - 1].toLowerCase();
  if (lastLower === "usa" || lastLower === "us" || lastLower === "united states") {
    parts = parts.slice(0, -1);
  }
  if (parts.length < 2) return {};

  const statePart = parts[parts.length - 1];
  const state = statePart.replace(/\s*\d{5}(-\d{4})?.*$/, "").trim();
  const city = parts[parts.length - 2];

  return { city, state: state || undefined };
}

function looksLikeStreet(value) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^\d+\s/.test(trimmed)) return true;
  if (/\b(floor|suite|ste|unit|apt|building|bldg|#)\b/i.test(trimmed)) return true;
  if (/\b\d+(st|nd|rd|th)\b/i.test(trimmed)) return true;
  if (
    /\d/.test(trimmed) &&
    /\b(st|street|ste|suite|ave|avenue|rd|road|blvd|dr|drive|ln|lane|way|ct|court|pl|place)\b/i.test(
      trimmed
    )
  ) {
    return true;
  }
  return false;
}

function resolveLeadCity(business) {
  const rawCity = business.city?.trim() ?? "";

  if (business.address) {
    const { city } = extractCityState(business.address);
    const fromAddress = normalizeCityName(city);
    if (fromAddress && (!rawCity || looksLikeStreet(rawCity) || !normalizeCityName(rawCity))) {
      return fromAddress;
    }
  }

  return normalizeCityName(rawCity);
}

async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst({ where: { email: "a7madnehela@gmail.com" } });
  const leads = await prisma.lead.findMany({
    where: { userId: user.id, contactStatus: { not: "CLOSED_LOST" } },
    select: {
      business: { select: { name: true, city: true, address: true, lat: true, lng: true } },
    },
  });

  const cityCounts = new Map();
  const unresolved = [];

  for (const l of leads) {
    const city = resolveLeadCity(l.business);
    if (city) {
      cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
    } else {
      unresolved.push(l.business);
    }
  }

  const sorted = [...cityCounts.entries()].sort((a, b) => b[1] - a[1]);
  console.log("Active leads:", leads.length);
  console.log("Resolved cities:", cityCounts.size);
  console.log("Leads with resolved city:", sorted.reduce((s, [, c]) => s + c, 0));
  console.log("Unresolved:", unresolved.length);
  console.log("\nTop cities:");
  sorted.slice(0, 15).forEach(([c, n]) => console.log(`  ${c}: ${n}`));
  if (unresolved.length) {
    console.log("\nUnresolved samples:");
    unresolved.slice(0, 10).forEach((b) =>
      console.log(`  city="${b.city}" addr="${b.address?.slice(0, 60)}"`)
    );
  }

  await prisma.$disconnect();
}

main();
