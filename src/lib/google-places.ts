/**
 * Google Places API (New) - server-side only.
 * Uses Text Search: https://developers.google.com/maps/documentation/places/web-service/text-search
 * Or we can use Place Search (Nearby) with lat/lng.
 * For "city + state + radius + business type" we use Text Search with query.
 */

const PLACES_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";

const SOCIAL_DOMAINS = [
  "facebook.com",
  "fb.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "yelp.com",
  "tripadvisor.com",
];

export function isSocialOnlyWebsite(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return SOCIAL_DOMAINS.some((d) => lower.includes(d));
}

export function hasNoRealWebsite(
  website: string | null | undefined
): boolean {
  return !website || isSocialOnlyWebsite(website);
}

export interface PlaceResult {
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
  lat?: number;
  lng?: number;
  hasSocialOnly: boolean;
  noWebsite: boolean;
  photoUrl?: string;
}

function extractCityState(formattedAddress: string): { city?: string; state?: string } {
  const parts = formattedAddress.split(",").map((p) => p.trim());
  let state: string | undefined;
  let city: string | undefined;
  if (parts.length >= 2) {
    state = parts[parts.length - 2].replace(/\s*\d{5}.*$/, "").trim();
    city = parts[parts.length - 3];
  }
  return { city, state };
}

export async function searchPlaces(params: {
  city: string;
  state: string;
  radiusMiles: number;
  businessType: string;
}): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set");

  const query = `${params.businessType} in ${params.city}, ${params.state}`;
  const body = {
    textQuery: query,
    maxResultCount: 20,
  };

  const res = await fetch(PLACES_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,places.location,places.types,places.photos",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Places API error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      nationalPhoneNumber?: string;
      internationalPhoneNumber?: string;
      rating?: number;
      userRatingCount?: number;
      websiteUri?: string;
      location?: { latitude?: number; longitude?: number };
      types?: string[];
      photos?: Array<{ name: string }>;
    }>;
  };

  const places = data.places ?? [];
  const results: PlaceResult[] = [];

  for (const p of places) {
    const placeId = p.id ?? "";
    const name = p.displayName?.text ?? "Unknown";
    const address = p.formattedAddress ?? "";
    const { city, state } = extractCityState(address);
    const phone = p.nationalPhoneNumber ?? p.internationalPhoneNumber;
    const website = p.websiteUri;
    const rating = p.rating;
    const reviewCount = p.userRatingCount ?? 0;
    const lat = p.location?.latitude;
    const lng = p.location?.longitude;
    const hasSocialOnly = !!website && isSocialOnlyWebsite(website);
    const noWebsite = !website || hasSocialOnly;
    const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    const photoUrl = p.photos?.[0]?.name
      ? `https://places.googleapis.com/v1/${p.photos[0].name}/media?key=${apiKey}&maxHeightPx=400`
      : undefined;

    results.push({
      placeId,
      name,
      address,
      city,
      state,
      phone,
      website: website ?? undefined,
      rating,
      reviewCount,
      googleMapsUrl,
      businessType: params.businessType,
      lat,
      lng,
      hasSocialOnly,
      noWebsite,
      photoUrl,
    });
  }

  return results;
}
