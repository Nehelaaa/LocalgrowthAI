"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";

export async function ownerUsageLastNDays(nDays: number) {
  await requireOwnerOrRedirect();
  const n = z.number().int().min(1).max(90).parse(nDays);

  const today = new Date();
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const [searchRows, aiRows] = await Promise.all([
    prisma.searchDayUsage.groupBy({
      by: ["day"],
      where: { day: { in: days } },
      _sum: { count: true },
    }),
    prisma.aiDayUsage.groupBy({
      by: ["day"],
      where: { day: { in: days } },
      _sum: { count: true },
    }),
  ]);

  const searchMap = new Map(searchRows.map((r) => [r.day, r._sum.count ?? 0]));
  const aiMap = new Map(aiRows.map((r) => [r.day, r._sum.count ?? 0]));

  return days.map((day) => ({
    day,
    searches: searchMap.get(day) ?? 0,
    aiCalls: aiMap.get(day) ?? 0,
  }));
}

export async function ownerTopUsersBySearches(day: string) {
  await requireOwnerOrRedirect();
  const d = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(day);

  const rows = await prisma.searchDayUsage.findMany({
    where: { day: d },
    orderBy: { count: "desc" },
    take: 30,
    include: { user: { select: { id: true, email: true, name: true, plan: true, disabled: true } } },
  });
  return rows.map((r) => ({
    userId: r.userId,
    email: r.user.email,
    name: r.user.name,
    plan: r.user.plan,
    disabled: r.user.disabled,
    count: r.count,
  }));
}

