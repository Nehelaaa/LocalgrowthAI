/**
 * Best-effort parse of a freeform website price (e.g. "$3,500", "3.5k", "3200") to a number in major currency units.
 */
export function parseMoneyFromQuote(input: string): number {
  const raw = input.trim().toLowerCase();
  if (!raw) return 0;

  const kMatch = raw.match(/([\d.,]+)\s*k\b/);
  if (kMatch) {
    const n = parseFloat(kMatch[1].replace(/,/g, ""));
    if (Number.isFinite(n)) return Math.round(n * 1000 * 100) / 100;
  }

  const mMatch = raw.match(/([\d.,]+)\s*m\b/);
  if (mMatch) {
    const n = parseFloat(mMatch[1].replace(/,/g, ""));
    if (Number.isFinite(n)) return Math.round(n * 1_000_000 * 100) / 100;
  }

  const digits = raw.replace(/[^\d.]/g, "");
  if (!digits) return 0;
  const n = parseFloat(digits);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoneyUSD(amount: number): string {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
