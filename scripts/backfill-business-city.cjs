/**
 * Fix Business.city when a street address was saved instead of the city name.
 * Run: node scripts/backfill-business-city.cjs
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
  const trimmed = (value || "").trim();
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

async function main() {
  const businesses = await prisma.business.findMany({
    where: { address: { not: null } },
    select: { id: true, name: true, city: true, state: true, address: true },
  });

  let updated = 0;
  for (const biz of businesses) {
    if (!biz.address || !looksLikeStreet(biz.city ?? "")) continue;

    const { city, state } = extractCityState(biz.address);
    const parsedCity = normalizeCityName(city);
    if (!parsedCity) continue;

    await prisma.business.update({
      where: { id: biz.id },
      data: {
        city: parsedCity,
        ...(state && !biz.state ? { state } : {}),
      },
    });
    updated += 1;
    console.log(`  ✓ ${biz.name}: "${biz.city}" → "${parsedCity}"`);
  }

  console.log(`\nUpdated ${updated} businesses`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
