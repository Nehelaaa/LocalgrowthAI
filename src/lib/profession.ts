/** Stored on User.profession — drives dashboard copy and optional Trades hub. */
export const PROFESSIONS = {
  web_agency: { label: "Web / local SEO agency", order: 0 },
  real_estate: { label: "Real estate", order: 1 },
  trades: { label: "Electrician / plumber / HVAC / contractor", order: 2 },
  sales: { label: "Sales", order: 3 },
  freelance: { label: "Freelancer", order: 4 },
  agency: { label: "Marketing / creative agency", order: 5 },
  other: { label: "Other", order: 6 },
} as const;

export type ProfessionId = keyof typeof PROFESSIONS;

const TRADES_ID: ProfessionId = "trades";

export function isTradesProfession(
  p: string | null | undefined
): p is typeof TRADES_ID {
  return p === TRADES_ID;
}

export function professionLabel(
  p: string | null | undefined
): string {
  if (!p) return "Not set";
  const id = p as ProfessionId;
  return PROFESSIONS[id]?.label ?? p;
}
