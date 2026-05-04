import type Stripe from "stripe";

/** Paginate Stripe invoices with `created >= createdGteUnix`. */
export async function listInvoicesCreatedSince(
  stripe: Stripe,
  createdGteUnix: number,
  maxPages = 40,
): Promise<Stripe.Invoice[]> {
  const out: Stripe.Invoice[] = [];
  let starting_after: string | undefined;
  for (let p = 0; p < maxPages; p++) {
    const res = await stripe.invoices.list({
      created: { gte: createdGteUnix },
      limit: 100,
      starting_after,
    });
    out.push(...res.data);
    if (!res.has_more) break;
    const last = res.data[res.data.length - 1];
    if (!last) break;
    starting_after = last.id;
  }
  return out;
}

export function utcMonthKeyFromUnix(unix: number): string {
  const d = new Date(unix * 1000);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function formatUtcMonthLabel(monthKey: string): string {
  const [ys, ms] = monthKey.split("-");
  const y = Number(ys);
  const mo = Number(ms);
  if (!Number.isFinite(y) || !Number.isFinite(mo)) return monthKey;
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Newest first, e.g. last 12 calendar months in UTC. */
export function lastNUtcMonthKeysDescending(n: number, now = new Date()): string[] {
  const keys: string[] = [];
  const y = now.getUTCFullYear();
  const startM = now.getUTCMonth();
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(y, startM - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function subscriptionOnInvoice(inv: Stripe.Invoice): boolean {
  const sub = (inv as unknown as { subscription?: string | Stripe.Subscription | null }).subscription;
  if (!sub) return false;
  if (typeof sub === "string") return sub.length > 0;
  return !("deleted" in sub && sub.deleted);
}

function customerDedupeKey(inv: Stripe.Invoice): string {
  const em = inv.customer_email?.trim().toLowerCase();
  if (em) return `e:${em}`;
  const c = inv.customer;
  if (typeof c === "string") return `c:${c}`;
  if (c && typeof c === "object" && "deleted" in c && !c.deleted && "id" in c) {
    return `c:${(c as Stripe.Customer).id}`;
  }
  return `i:${inv.id}`;
}

type MonthAgg = {
  paidCustomers: Set<string>;
  unpaidCustomers: Set<string>;
  openCustomers: Set<string>;
  uncollectibleCustomers: Set<string>;
  paidInvoiceCount: number;
  unpaidInvoiceCount: number;
  collectedCents: number;
  currency: string;
};

/**
 * Subscription invoices only, grouped by invoice.created (UTC month).
 * Unpaid = open with amount due/remaining, or uncollectible (failed collection).
 */
export function aggregateSubscriptionInvoicesByUtcMonth(
  invoices: Stripe.Invoice[],
): Map<string, MonthAgg> {
  const map = new Map<string, MonthAgg>();
  const get = (mk: string): MonthAgg => {
    let m = map.get(mk);
    if (!m) {
      m = {
        paidCustomers: new Set(),
        unpaidCustomers: new Set(),
        openCustomers: new Set(),
        uncollectibleCustomers: new Set(),
        paidInvoiceCount: 0,
        unpaidInvoiceCount: 0,
        collectedCents: 0,
        currency: "usd",
      };
      map.set(mk, m);
    }
    return m;
  };

  for (const inv of invoices) {
    if (inv.status === "draft") continue;
    if (inv.status === "void") continue;
    if (!subscriptionOnInvoice(inv)) continue;

    const mk = utcMonthKeyFromUnix(inv.created);
    const row = get(mk);
    if (inv.currency) row.currency = inv.currency.toLowerCase();
    const ck = customerDedupeKey(inv);

    if (inv.status === "paid" && (inv.amount_paid ?? 0) > 0) {
      row.paidCustomers.add(ck);
      row.paidInvoiceCount += 1;
      row.collectedCents += inv.amount_paid ?? 0;
    }

    if (inv.status === "open") {
      const openOwed = (inv.amount_remaining ?? inv.amount_due ?? 0) > 0;
      if (openOwed) {
        row.openCustomers.add(ck);
        row.unpaidCustomers.add(ck);
        row.unpaidInvoiceCount += 1;
      }
    } else if (inv.status === "uncollectible") {
      row.uncollectibleCustomers.add(ck);
      row.unpaidCustomers.add(ck);
      row.unpaidInvoiceCount += 1;
    }
  }

  return map;
}

export type SubscriptionMonthRollupRow = {
  monthKey: string;
  label: string;
  paidCustomers: number;
  paidInvoices: number;
  collectedCents: number;
  currency: string;
  unpaidCustomers: number;
  openCustomers: number;
  uncollectibleCustomers: number;
  unpaidInvoices: number;
};

export function buildSubscriptionMonthRollupRows(
  agg: Map<string, MonthAgg>,
  monthKeysNewestFirst: string[],
): SubscriptionMonthRollupRow[] {
  return monthKeysNewestFirst.map((monthKey) => {
    const a = agg.get(monthKey);
    return {
      monthKey,
      label: formatUtcMonthLabel(monthKey),
      paidCustomers: a?.paidCustomers.size ?? 0,
      paidInvoices: a?.paidInvoiceCount ?? 0,
      collectedCents: a?.collectedCents ?? 0,
      currency: a?.currency ?? "usd",
      unpaidCustomers: a?.unpaidCustomers.size ?? 0,
      openCustomers: a?.openCustomers.size ?? 0,
      uncollectibleCustomers: a?.uncollectibleCustomers.size ?? 0,
      unpaidInvoices: a?.unpaidInvoiceCount ?? 0,
    };
  });
}

/** First moment of the month N months ago (UTC), as Unix seconds. */
export function utcMonthStartUnixMonthsAgo(monthsAgo: number, now = new Date()): number {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = new Date(Date.UTC(y, m - monthsAgo, 1, 0, 0, 0, 0));
  return Math.floor(d.getTime() / 1000);
}
