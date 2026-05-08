import { googleMapsListingUrl } from "@/lib/google-maps-links";

/**
 * Google Places API (New) - server-side only.
 * Text Search: https://developers.google.com/maps/documentation/places/web-service/text-search
 *
 * Per Google: up to 20 results per request; use nextPageToken + pageToken for more pages
 * (typically up to ~60 total results). Radius uses a map viewport around your city
 * (geocoded) plus a tight mile-radius filter on coordinates).
 */

const PLACES_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

/** Google caps page size at 20; we fetch multiple pages via pageToken. */
const TEXT_SEARCH_PAGE_SIZE = 20;

/** Stop after this many pages even if token keeps coming (safety + billing). */
const TEXT_SEARCH_MAX_PAGES = 5;

/** Delay before using nextPageToken (Google requires the token to become valid). */
const PAGE_TOKEN_DELAY_MS = 2000;

function viewportForRadiusMiles(
  lat: number,
  lng: number,
  radiusMiles: number
): { low: { latitude: number; longitude: number }; high: { latitude: number; longitude: number } } {
  const dLat = radiusMiles / 69;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const dLng = radiusMiles / (69 * Math.max(0.15, Math.abs(cosLat)));
  const clampLat = (x: number) => Math.max(-85, Math.min(85, x));
  const wrapLng = (x: number) => ((((x + 180) % 360) + 360) % 360) - 180;

  return {
    low: {
      latitude: clampLat(lat - dLat),
      longitude: wrapLng(lng - dLng),
    },
    high: {
      latitude: clampLat(lat + dLat),
      longitude: wrapLng(lng + dLng),
    },
  };
}

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Great-circle distance in miles (WGS84 sphere). */
function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.7613;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

async function geocodeCityStateCenter(params: {
  city: string;
  state: string;
  apiKey: string;
}): Promise<{ lat: number; lng: number } | null> {
  const address = `${params.city.trim()}, ${params.state.trim()}, USA`;
  const url = new URL(GEOCODE_URL);
  url.searchParams.set("address", address);
  url.searchParams.set("key", params.apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status?: string;
    results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }>;
  };
  if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) {
    return null;
  }
  const loc = data.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

type PlacesApiPlace = {
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
};

function mapPlaceToResult(
  p: PlacesApiPlace,
  params: { businessType: string },
  apiKey: string
): PlaceResult {
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
  const googleMapsUrl = googleMapsListingUrl(placeId, name);
  const photoUrl = p.photos?.[0]?.name
    ? `https://places.googleapis.com/v1/${p.photos[0].name}/media?key=${apiKey}&maxHeightPx=400`
    : undefined;

  return {
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
  };
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

  const center = await geocodeCityStateCenter({
    city: params.city,
    state: params.state,
    apiKey,
  });

  const viewport = center
    ? viewportForRadiusMiles(center.lat, center.lng, params.radiusMiles)
    : null;

  const baseBody: Record<string, unknown> = {
    textQuery: query,
    languageCode: "en",
    regionCode: "US",
    pageSize: TEXT_SEARCH_PAGE_SIZE,
    ...(viewport
      ? {
          locationRestriction: {
            rectangle: {
              low: {
                latitude: viewport.low.latitude,
                longitude: viewport.low.longitude,
              },
              high: {
                latitude: viewport.high.latitude,
                longitude: viewport.high.longitude,
              },
            },
          },
          rankPreference: "DISTANCE",
        }
      : {}),
  };

  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    // nextPageToken must be listed or pagination is omitted and only the first 20 results return.
    "X-Goog-FieldMask":
      "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,places.location,places.types,places.photos,nextPageToken",
  };

  const mergedById = new Map<string, PlaceResult>();
  let pageToken: string | undefined;
  let pages = 0;

  while (pages < TEXT_SEARCH_MAX_PAGES) {
    const body =
      pageToken != null && pageToken !== ""
        ? {
            ...baseBody,
            pageSize: TEXT_SEARCH_PAGE_SIZE,
            pageToken,
          }
        : baseBody;

    if (pageToken) {
      await sleep(PAGE_TOKEN_DELAY_MS);
    }

    const res = await fetch(PLACES_TEXT_SEARCH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Places API error: ${res.status} ${err}`);
    }

    const data = (await res.json()) as {
      places?: PlacesApiPlace[];
      nextPageToken?: string;
    };

    const places = data.places ?? [];
    for (const p of places) {
      const row = mapPlaceToResult(p, params, apiKey);
      if (row.placeId && !mergedById.has(row.placeId)) {
        mergedById.set(row.placeId, row);
      }
    }

    pageToken = data.nextPageToken;
    pages += 1;

    if (!pageToken) break;
  }

  let results = [...mergedById.values()];

  if (center && params.radiusMiles > 0) {
    results = results.filter((r) => {
      if (r.lat == null || r.lng == null) return true;
      const miles = haversineMiles(center.lat, center.lng, r.lat, r.lng);
      return miles <= params.radiusMiles * 1.02;
    });
  }

  if (center) {
    results.sort((a, b) => {
      const da =
        a.lat != null && a.lng != null
          ? haversineMiles(center.lat, center.lng, a.lat, a.lng)
          : 1e9;
      const db =
        b.lat != null && b.lng != null
          ? haversineMiles(center.lat, center.lng, b.lat, b.lng)
          : 1e9;
      return da - db;
    });
  } else {
    results.sort((a, b) => (a.name || "").localeCompare(b.name || "", "en"));
  }

  return results;
}
