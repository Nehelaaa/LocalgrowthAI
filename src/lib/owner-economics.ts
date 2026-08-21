import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/** YYYY-MM-DD inclusive range (UTC day strings; lexical order matches chronological). */
export function utcDayRangeStrings(start: Date, end: Date): { startDay: string; endDay: string } {
  const startDay = start.toISOString().slice(0, 10);
  const endDay = end.toISOString().slice(0, 10);
  return { startDay, endDay };
}

export function googleCostPerSearchUsd(): number {
  return Number(process.env.GOOGLE_COST_PER_SEARCH_USD ?? "0.017") || 0.017;
}

export function aiCostPerCallUsd(): number {
  return Number(process.env.AI_COST_PER_CALL_USD ?? "0.02") || 0.02;
}

export async function aggregateApiUsageForDayRange(startDay: string, endDay: string) {
  const [searchAgg, aiAgg] = await Promise.all([
    prisma.searchDayUsage.aggregate({
      where: { day: { gte: startDay, lte: endDay } },
      _sum: { count: true },
    }),
    prisma.aiDayUsage.aggregate({
      where: { day: { gte: startDay, lte: endDay } },
      _sum: { count: true },
    }),
  ]);
  const searchCalls = searchAgg._sum.count ?? 0;
  const aiCalls = aiAgg._sum.count ?? 0;
  const g = googleCostPerSearchUsd();
  const a = aiCostPerCallUsd();
  const googleUsd = searchCalls * g;
  const aiUsd = aiCalls * a;
  return {
    searchCalls,
    aiCalls,
    googleUsd,
    aiUsd,
    totalUsd: googleUsd + aiUsd,
    googleUnitUsd: g,
    aiUnitUsd: a,
  };
}

/** Sum paid invoice amounts since `sinceUnix` (Stripe cents). Paginates up to `maxPages` (100 invoices each). */
export async function sumPaidInvoicesSince(
  sinceUnix: number,
  maxPages = 5
): Promise<{ cents: number; invoiceCount: number; truncated: boolean }> {
  if (!isStripeConfigured()) {
    return { cents: 0, invoiceCount: 0, truncated: false };
  }
  const stripe = getStripe();
  let cents = 0;
  let invoiceCount = 0;
  let startingAfter: string | undefined;
  let truncated = false;
  for (let p = 0; p < maxPages; p++) {
    const page = await stripe.invoices.list({
      status: "paid",
      created: { gte: sinceUnix },
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    if (page.data.length === 0) break;
    for (const inv of page.data) {
      cents += inv.amount_paid ?? 0;
      invoiceCount += 1;
    }
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1]?.id;
    if (!startingAfter) break;
    if (p === maxPages - 1 && page.has_more) truncated = true;
  }
  return { cents, invoiceCount, truncated };
}

export type StripeActiveSubscriptionSnapshot = {
  configured: boolean;
  /** Count of Stripe subscriptions with status=active (paginated first page, limit 100). */
  activeSubscriptionCount: number;
  /** Rough MRR in cents from those active subscription line items. */
  mrrCents: number;
};

/**
 * Single source of truth for owner Overview + Revenue + Costs MRR cards.
 * Same formula previously inlined on /owner/revenue.
 */
export async function getStripeActiveSubscriptionSnapshot(): Promise<StripeActiveSubscriptionSnapshot> {
  if (!isStripeConfigured()) {
    return { configured: false, activeSubscriptionCount: 0, mrrCents: 0 };
  }
  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({ status: "active", limit: 100 });
  const mrrCents = subs.data.reduce((sum, s) => {
    const item = s.items.data[0];
    const price = item?.price?.unit_amount ?? 0;
    const interval = item?.price?.recurring?.interval ?? "month";
    const monthly =
      interval === "year"
        ? Math.round(price / 12)
        : interval === "week"
          ? Math.round(price * 4.33)
          : price;
    return sum + monthly;
  }, 0);
  return {
    configured: true,
    activeSubscriptionCount: subs.data.length,
    mrrCents,
  };
}

/** @deprecated Prefer getStripeActiveSubscriptionSnapshot — kept for call-site convenience. */
export async function estimateStripeMrrCents(): Promise<number> {
  const snap = await getStripeActiveSubscriptionSnapshot();
  return snap.mrrCents;
}

/** Distinct userIds with SearchDayUsage, AiDayUsage, or Lead activity since `since`. */
export async function countActiveUsersSince(since: Date): Promise<number> {
  const sinceDay = since.toISOString().slice(0, 10);
  const [searchRows, aiRows, leadRows] = await Promise.all([
    prisma.searchDayUsage.findMany({
      where: { day: { gte: sinceDay } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.aiDayUsage.findMany({
      where: { day: { gte: sinceDay } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.lead.findMany({
      where: { updatedAt: { gte: since }, userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);
  const ids = new Set<string>();
  for (const r of searchRows) ids.add(r.userId);
  for (const r of aiRows) ids.add(r.userId);
  for (const r of leadRows) {
    if (r.userId) ids.add(r.userId);
  }
  return ids.size;
}
