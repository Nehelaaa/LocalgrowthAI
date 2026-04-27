import { prisma } from "@/lib/db";
import { getDailySearchLimit } from "@/lib/entitlements";
import type { User } from "@prisma/client";

/** YYYY-MM-DD in UTC (aligned with search-day quota windows). */
export function getUtcDayString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export async function getSearchUsageState(user: User) {
  const day = getUtcDayString();
  const limit = getDailySearchLimit(user);
  const row = await prisma.searchDayUsage.findUnique({
    where: { userId_day: { userId: user.id, day } },
  });
  const used = row?.count ?? 0;
  return {
    day,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

/**
 * Whether another Google API-backed search is allowed. Cache hits do not use this
 * (call only when you will hit Google).
 */
export async function canPerformGoogleSearch(user: User): Promise<boolean> {
  const { remaining } = await getSearchUsageState(user);
  return remaining > 0;
}

export async function incrementSearchUsageForUser(
  userId: string
): Promise<void> {
  const day = getUtcDayString();
  await prisma.searchDayUsage.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day, count: 1 },
    update: { count: { increment: 1 } },
  });
}
