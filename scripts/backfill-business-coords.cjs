/**
 * Backfill Business.lat / Business.lng from stored addresses via Google Geocoding API.
 * Run: node scripts/backfill-business-coords.cjs
 * Optional: node scripts/backfill-business-coords.cjs --dry-run
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");
const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const DELAY_MS = 120;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geocodeAddress(address, apiKey) {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set("address", address);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) {
    return null;
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}

async function main() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_PLACES_API_KEY is not set");
    process.exit(1);
  }

  const missing = await prisma.business.findMany({
    where: {
      OR: [{ lat: null }, { lng: null }],
      address: { not: null },
    },
    select: { id: true, name: true, address: true, placeId: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${missing.length} businesses missing coordinates${dryRun ? " (dry run)" : ""}`);

  let updated = 0;
  let failed = 0;

  for (const biz of missing) {
    const address = biz.address?.trim();
    if (!address) {
      failed += 1;
      continue;
    }

    const coords = await geocodeAddress(address, apiKey);
    if (!coords) {
      console.warn(`  ✗ ${biz.name}: could not geocode`);
      failed += 1;
      await sleep(DELAY_MS);
      continue;
    }

    if (!dryRun) {
      await prisma.business.update({
        where: { id: biz.id },
        data: { lat: coords.lat, lng: coords.lng },
      });
    }

    updated += 1;
    console.log(`  ✓ ${biz.name}: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
    await sleep(DELAY_MS);
  }

  console.log(`\nDone: ${updated} updated, ${failed} failed`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
