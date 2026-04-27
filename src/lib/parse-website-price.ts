/**
 * Best-effort parse of freeform website price strings ("$3,200", "3200", "3.5k", etc.)
 * for dashboard totals. Returns 0 if nothing usable.
 */
export function parseWebsitePrice(quote: string | null | undefined): number {
  if (quote == null || String(quote).trim() === "") return 0;
  const t = String(quote).trim().toLowerCase().replaceAll(",", "");
  const k = t.match(/([\d.]+)\s*k\b/);
  if (k) {
    const n = parseFloat(k[1]);
    return Number.isFinite(n) ? n * 1000 : 0;
  }
  const digits = t.replace(/[^0-9.]/g, "");
  if (!digits) return 0;
  const n = parseFloat(digits);
  return Number.isFinite(n) ? n : 0;
}
