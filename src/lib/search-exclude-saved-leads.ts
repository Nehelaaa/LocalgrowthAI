import { prisma } from "@/lib/db";

/** Remove Google places the current user already saved as CRM leads. */
export async function excludeUserSavedPlaces<T extends { placeId: string }>(
  userId: string,
  places: T[]
): Promise<{ places: T[]; hiddenCount: number }> {
  if (places.length === 0) {
    return { places: [], hiddenCount: 0 };
  }

  const placeIds = [...new Set(places.map((p) => p.placeId).filter(Boolean))];
  if (placeIds.length === 0) {
    return { places, hiddenCount: 0 };
  }

  const existing = await prisma.lead.findMany({
    where: {
      userId,
      business: { placeId: { in: placeIds } },
    },
    select: { business: { select: { placeId: true } } },
  });

  const saved = new Set(existing.map((l) => l.business.placeId));
  const filtered = places.filter((p) => !saved.has(p.placeId));
  return {
    places: filtered,
    hiddenCount: places.length - filtered.length,
  };
}
