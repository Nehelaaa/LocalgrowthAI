/** Lead list loads at most this many rows (plus one probe row) before sort/pagination. */
export const LEADS_FETCH_CAP = 4000;

export const LEADS_DEFAULT_PAGE_SIZE = 15;

export const LEADS_PAGE_SIZES = new Set<number>([15, 25, 50, 100]);

export type LeadsPerPage = 15 | 25 | 50 | 100 | "all";

export function parseLeadsPageQuery(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

/** URL `perPage`: 15 | 25 | 50 | 100 | all */
export function parseLeadsPerPageQuery(raw: string | undefined): LeadsPerPage {
  if (raw === "all") return "all";
  const n = Number(raw);
  if (LEADS_PAGE_SIZES.has(n)) return n as LeadsPerPage;
  return LEADS_DEFAULT_PAGE_SIZE;
}
