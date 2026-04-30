import { prisma } from "@/lib/db";
import {
  FREE_SEARCHES_LIFETIME,
  PRO_SEARCHES_PER_DAY,
  hasProEntitlement,
} from "@/lib/entitlements";
import type { User } from "@prisma/client";

/** YYYY-MM-DD in UTC (Pro daily quota windows). */
export function getUtcDayString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export type SearchUsageState = {
  /** Starter uses a lifetime counter on `User`; Pro uses per-day `SearchDayUsage`. */
  mode: "lifetime" | "daily";
  /** Present for Pro (`daily`); null for Starter (`lifetime`). */
  day: string | null;
  used: number;
  limit: number;
  remaining: number;
};

export async function getSearchUsageState(user: User): Promise<SearchUsageState> {
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      lifetimeGoogleSearches: true,
      plan: true,
      subscriptionStatus: true,
      grandfatheredPro: true,
    },
  });
  const entUser = { ...user, ...(fresh ?? {}) };

  if (hasProEntitlement(entUser as User)) {
    const day = getUtcDayString();
    const limit = PRO_SEARCHES_PER_DAY;
    const row = await prisma.searchDayUsage.findUnique({
      where: { userId_day: { userId: user.id, day } },
    });
    const used = row?.count ?? 0;
    return {
      mode: "daily",
      day,
      used,
      limit,
      remaining: Math.max(0, limit - used),
    };
  }

  const used = fresh?.lifetimeGoogleSearches ?? 0;
  const limit = FREE_SEARCHES_LIFETIME;
  return {
    mode: "lifetime",
    day: null,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function incrementGoogleSearchUsage(userId: string): Promise<void> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true, grandfatheredPro: true },
  });
  if (!u) return;

  if (hasProEntitlement(u as User)) {
    const day = getUtcDayString();
    await prisma.searchDayUsage.upsert({
      where: { userId_day: { userId, day } },
      create: { userId, day, count: 1 },
      update: { count: { increment: 1 } },
    });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lifetimeGoogleSearches: { increment: 1 } },
  });
}
