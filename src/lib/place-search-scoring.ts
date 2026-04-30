/**
 * Heuristic scores and filters for Google Places search results.
 * We only have listing fields (rating, review count, website URL)—not true social audits or revenue.
 */

export type PlaceRow = {
  placeId: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount: number;
  googleMapsUrl: string;
  businessType?: string;
  hasSocialOnly: boolean;
  noWebsite: boolean;
  photoUrl?: string;
};

export type Tier = "high" | "medium" | "low";
export type SortMode = "default" | "opportunity" | "value";

export type PlaceFilterState = {
  nameQuery: string;
  minRating: number | null;
  minReviews: number | null;
  maxReviews: number | null;
  websiteMode: "any" | "no" | "real";
  requireNoInstagram: boolean;
  requireNoFacebook: boolean;
  opportunityHigh: boolean;
  opportunityMedium: boolean;
  opportunityLow: boolean;
  valueHigh: boolean;
  valueMedium: boolean;
  valueLow: boolean;
  competitionLow: boolean;
  competitionHigh: boolean;
  activityNoRecentReviews: boolean;
  activityLowEngagement: boolean;
  /** Fast closers preset — listing includes a callable phone. */
  requirePhone: boolean;
  sort: SortMode;
};

export const defaultPlaceFilterState = (): PlaceFilterState => ({
  nameQuery: "",
  minRating: null,
  minReviews: null,
  maxReviews: null,
  websiteMode: "any",
  requireNoInstagram: false,
  requireNoFacebook: false,
  opportunityHigh: false,
  opportunityMedium: false,
  opportunityLow: false,
  valueHigh: false,
  valueMedium: false,
  valueLow: false,
  competitionLow: false,
  competitionHigh: false,
  activityNoRecentReviews: false,
  activityLowEngagement: false,
  requirePhone: false,
  sort: "default",
});

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function websiteLower(p: PlaceRow): string {
  return (p.website ?? "").toLowerCase();
}

/** True if the listing URL points at Instagram (common for SMBs). */
export function placeHasInstagramLink(p: PlaceRow): boolean {
  const w = websiteLower(p);
  return w.includes("instagram.com") || w.includes("instagr.am");
}

/** True if the listing URL points at Facebook. */
export function placeHasFacebookLink(p: PlaceRow): boolean {
  const w = websiteLower(p);
  return w.includes("facebook.com") || w.includes("fb.com") || w.includes("fb.me");
}

/** 0–100: higher = stronger fit for web/digital help (weak site + room to grow). */
export function scoreOpportunity(p: PlaceRow): number {
  let s = 42;
  if (p.noWebsite) s += 28;
  else if (p.hasSocialOnly) s += 18;
  if (p.reviewCount < 18) s += 14;
  if (p.reviewCount > 85) s -= 18;
  if (p.rating != null && p.rating >= 4.6 && p.reviewCount > 45) s -= 12;
  if (p.rating != null && p.rating < 3.7) s += 8;
  return clamp(s, 0, 100);
}

/** 0–100: higher = more established listing (reviews + rating as proxy). */
export function scoreValue(p: PlaceRow): number {
  const r = p.reviewCount;
  const rat = p.rating ?? 3.5;
  const volume = Math.log10(r + 1) * 22;
  const quality = (rat - 3) * 14;
  return clamp(volume + quality + 8, 0, 100);
}

export function opportunityTier(p: PlaceRow): Tier {
  const s = scoreOpportunity(p);
  if (s >= 68) return "high";
  if (s >= 38) return "medium";
  return "low";
}

export function valueTier(p: PlaceRow): Tier {
  const s = scoreValue(p);
  if (s >= 62) return "high";
  if (s >= 36) return "medium";
  return "low";
}

/** "Competition" = how strong this listing looks vs peers (reviews + stars). */
export function competitionLevel(p: PlaceRow): "low" | "high" {
  const r = p.reviewCount;
  const rat = p.rating ?? 0;
  if (r >= 75 && rat >= 4.25) return "high";
  if (r < 32) return "low";
  if (rat > 0 && rat < 3.85 && r < 70) return "low";
  if (r < 55 && rat < 4.4) return "low";
  return "high";
}

/** Very few reviews — listing looks quiet / stale (proxy only). */
export function placeHasNoRecentReviewsSignal(p: PlaceRow): boolean {
  return p.reviewCount <= 5;
}

export function placeHasLowEngagement(p: PlaceRow): boolean {
  return p.reviewCount < 22;
}

export function placeHasPhone(p: PlaceRow): boolean {
  return Boolean(p.phone && p.phone.replace(/\D/g, "").length >= 7);
}

function selectedOpportunityTiers(s: PlaceFilterState): Tier[] {
  const t: Tier[] = [];
  if (s.opportunityHigh) t.push("high");
  if (s.opportunityMedium) t.push("medium");
  if (s.opportunityLow) t.push("low");
  return t;
}

function selectedValueTiers(s: PlaceFilterState): Tier[] {
  const t: Tier[] = [];
  if (s.valueHigh) t.push("high");
  if (s.valueMedium) t.push("medium");
  if (s.valueLow) t.push("low");
  return t;
}

function selectedCompetition(s: PlaceFilterState): ("low" | "high")[] {
  const t: ("low" | "high")[] = [];
  if (s.competitionLow) t.push("low");
  if (s.competitionHigh) t.push("high");
  return t;
}

function matchesBasics(p: PlaceRow, s: PlaceFilterState): boolean {
  const q = s.nameQuery.trim().toLowerCase();
  if (q && !p.name.toLowerCase().includes(q)) return false;
  if (s.minRating != null && (p.rating == null || p.rating < s.minRating)) return false;
  if (s.minReviews != null && p.reviewCount < s.minReviews) return false;
  if (s.maxReviews != null && p.reviewCount > s.maxReviews) return false;
  if (s.requirePhone && !placeHasPhone(p)) return false;
  return true;
}

function matchesDigital(p: PlaceRow, s: PlaceFilterState): boolean {
  if (s.websiteMode === "no" && !p.noWebsite) return false;
  if (s.websiteMode === "real" && p.noWebsite) return false;
  if (s.requireNoInstagram && placeHasInstagramLink(p)) return false;
  if (s.requireNoFacebook && placeHasFacebookLink(p)) return false;
  return true;
}

function matchesOpportunity(p: PlaceRow, s: PlaceFilterState): boolean {
  const tiers = selectedOpportunityTiers(s);
  if (tiers.length === 0) return true;
  return tiers.includes(opportunityTier(p));
}

function matchesValue(p: PlaceRow, s: PlaceFilterState): boolean {
  const tiers = selectedValueTiers(s);
  if (tiers.length === 0) return true;
  return tiers.includes(valueTier(p));
}

function matchesCompetition(p: PlaceRow, s: PlaceFilterState): boolean {
  const tiers = selectedCompetition(s);
  if (tiers.length === 0) return true;
  return tiers.includes(competitionLevel(p));
}

function matchesActivity(p: PlaceRow, s: PlaceFilterState): boolean {
  if (!s.activityNoRecentReviews && !s.activityLowEngagement) return true;
  const checks: boolean[] = [];
  if (s.activityNoRecentReviews) checks.push(placeHasNoRecentReviewsSignal(p));
  if (s.activityLowEngagement) checks.push(placeHasLowEngagement(p));
  return checks.every(Boolean);
}

export function placeMatchesFilters(p: PlaceRow, s: PlaceFilterState): boolean {
  return (
    matchesBasics(p, s) &&
    matchesDigital(p, s) &&
    matchesOpportunity(p, s) &&
    matchesValue(p, s) &&
    matchesCompetition(p, s) &&
    matchesActivity(p, s)
  );
}

export function filterAndSortPlaces(
  places: PlaceRow[],
  s: PlaceFilterState
): PlaceRow[] {
  const filtered = places.filter((p) => placeMatchesFilters(p, s));
  if (s.sort === "default") return filtered;
  const scored = filtered.map((p) => ({
    p,
    o: scoreOpportunity(p),
    v: scoreValue(p),
  }));
  if (s.sort === "opportunity") {
    scored.sort((a, b) => b.o - a.o);
  } else {
    scored.sort((a, b) => b.v - a.v);
  }
  return scored.map((x) => x.p);
}

export type PresetId = "easy_wins" | "high_value" | "fast_closers";

export function applyPreset(id: PresetId): PlaceFilterState {
  const z = defaultPlaceFilterState();
  switch (id) {
    case "easy_wins":
      z.websiteMode = "no";
      z.opportunityHigh = true;
      z.competitionLow = true;
      z.sort = "opportunity";
      return z;
    case "high_value":
      z.valueHigh = true;
      z.sort = "value";
      return z;
    case "fast_closers":
      z.opportunityHigh = true;
      z.competitionLow = true;
      z.maxReviews = 45;
      z.minRating = 3.5;
      z.requirePhone = true;
      z.activityLowEngagement = true;
      z.sort = "opportunity";
      return z;
    default:
      return z;
  }
}
