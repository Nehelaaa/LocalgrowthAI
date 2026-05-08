import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import type { PlaceResult } from "@/lib/google-places";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Bump when search semantics change (e.g. multi-page Places) so old payloads are not reused. */
const CACHE_KEY_VERSION = "2";

export function placesSearchCacheKey(params: {
  city: string;
  state: string;
  radiusMiles: number;
  businessType: string;
}): string {
  const normalized = [
    params.city.trim().toLowerCase(),
    params.state.trim().toUpperCase(),
    String(params.radiusMiles),
    params.businessType.trim().toLowerCase(),
    CACHE_KEY_VERSION,
  ].join("|");
  return createHash("sha256").update(normalized).digest("hex");
}

export async function getCachedSearchResults(
  cacheKey: string
): Promise<PlaceResult[] | null> {
  const row = await prisma.placeSearchCache.findUnique({
    where: { cacheKey },
  });
  if (!row) return null;
  if (Date.now() - row.updatedAt.getTime() > CACHE_TTL_MS) {
    return null;
  }
  try {
    return JSON.parse(row.payload) as PlaceResult[];
  } catch {
    return null;
  }
}

export async function setCachedSearchResults(
  cacheKey: string,
  places: PlaceResult[]
): Promise<void> {
  const payload = JSON.stringify(places);
  await prisma.placeSearchCache.upsert({
    where: { cacheKey },
    create: { cacheKey, payload },
    update: { payload },
  });
}
