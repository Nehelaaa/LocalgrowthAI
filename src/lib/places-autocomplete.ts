/**
 * Google Places Autocomplete (New) – localities (cities) in the US.
 * https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
 */

const AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete";

export type CitySuggestion = {
  label: string;
  city: string;
  state: string;
  placeId: string;
};

/** Parse "Westborough, MA, USA" → city + state (best effort). */
export function parseLocalityLabel(text: string): { city: string; state: string } {
  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { city: text, state: "" };
  const city = parts[0];
  let state = "";
  for (let i = 1; i < parts.length; i++) {
    const seg = parts[i];
    const m = seg.match(/^([A-Za-z]{2})\b/);
    if (m) {
      state = m[1].toUpperCase();
      break;
    }
    if (/^[A-Za-z]{2}$/.test(seg)) {
      state = seg.toUpperCase();
      break;
    }
  }
  return { city, state };
}

export async function autocompleteCities(
  input: string,
  stateHint?: string
): Promise<CitySuggestion[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set");

  let q = input.trim();
  if (!q) return [];
  if (stateHint?.trim()) {
    const hint = stateHint.trim().toUpperCase();
    if (!q.toUpperCase().includes(hint)) {
      q = `${q} ${hint}`;
    }
  }

  const res = await fetch(AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "suggestions.placePrediction.placeId,suggestions.placePrediction.text",
    },
    body: JSON.stringify({
      input: q,
      includedRegionCodes: ["us"],
      includedPrimaryTypes: ["locality"],
      languageCode: "en",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Autocomplete error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string;
        text?: { text?: string };
      };
    }>;
  };

  const out: CitySuggestion[] = [];
  for (const s of data.suggestions ?? []) {
    const p = s.placePrediction;
    if (!p?.placeId || !p.text?.text) continue;
    const label = p.text.text;
    const { city, state } = parseLocalityLabel(label);
    out.push({
      label,
      city,
      state: state || (stateHint?.trim().toUpperCase() ?? ""),
      placeId: p.placeId,
    });
  }
  return out;
}
