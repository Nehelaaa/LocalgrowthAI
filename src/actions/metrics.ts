"use server";

import { requireUserForAction } from "@/lib/session-user";
import { parseWebsitePrice } from "@/lib/parse-website-price";
import { prisma } from "@/lib/db";

export async function getDashboardMetrics() {
  const user = await requireUserForAction();
  const forUser = { userId: user.id } as const;

  const [totalLeads, noWebsite, contacts, statusCounts, wonLeads] = await Promise.all([
    prisma.lead.count({ where: forUser }),
    prisma.lead.count({
      where: {
        userId: user.id,
        business: { is: { website: null } },
      },
    }),
    prisma.lead.count({
      where: {
        userId: user.id,
        contactStatus: { in: ["CONTACTED", "INTERESTED", "CLOSED_WON", "CLOSED_LOST"] },
      },
    }),
    prisma.lead.groupBy({
      by: ["contactStatus"],
      where: forUser,
      _count: true,
    }),
    prisma.lead.findMany({
      where: { userId: user.id, contactStatus: "CLOSED_WON" },
      select: { websiteQuote: true },
    }),
  ]);

  const closedWon = statusCounts.find((s) => s.contactStatus === "CLOSED_WON")?._count ?? 0;
  const conversionRate =
    totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;

  /** Sum of "Website price" on closed-won leads (the amount you enter per lead) — not a hardcoded $2,500. */
  const closedWonWebsiteValue = wonLeads.reduce(
    (sum, l) => sum + parseWebsitePrice(l.websiteQuote),
    0
  );

  return {
    totalLeads,
    noWebsiteCount: noWebsite,
    contactsMade: contacts,
    conversionRate,
    closedWon,
    closedWonWebsiteValue,
  };
}
