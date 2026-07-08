import { extractCityState } from "@/lib/google-places";

const US_STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS",
  "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY",
  "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
  "WI", "WY", "DC",
]);

const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA", colorado: "CO",
  connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
  illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN",
  mississippi: "MS", missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR",
  pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
  tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT", virginia: "VA", washington: "WA",
  "west virginia": "WV", wisconsin: "WI", wyoming: "WY", "district of columbia": "DC",
};

export function normalizeUsState(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 2) {
    const code = trimmed.toUpperCase();
    return US_STATE_CODES.has(code) ? code : null;
  }
  return STATE_NAME_TO_CODE[trimmed.toLowerCase()] ?? null;
}

function looksLikeCityNotState(state: string | null, city: string | null): boolean {
  if (!state) return true;
  if (state.length > 3) return !normalizeUsState(state);
  if (city && state.toLowerCase() === city.toLowerCase()) return true;
  return !normalizeUsState(state);
}

/** Display label like "Arlington, MA" — never "Arlington, Arlington". */
export function formatBusinessLocation(opts: {
  city?: string | null;
  state?: string | null;
  address?: string | null;
}): string {
  let city = opts.city?.trim() || null;
  let state = normalizeUsState(opts.state);

  if (opts.address?.trim()) {
    const parsed = extractCityState(opts.address);
    const addrCity = parsed.city?.trim() || null;
    const addrState = normalizeUsState(parsed.state);

    if (addrCity && (!city || looksLikeCityNotState(opts.state ?? null, city))) {
      city = addrCity;
    }
    if (addrState) {
      state = addrState;
    }
  }

  if (city && state && city.toLowerCase() === state.toLowerCase()) {
    state = null;
  }

  const parts = [city, state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}
