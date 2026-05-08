/**
 * Google Maps universal URL scheme (web + mobile).
 * @see https://developers.google.com/maps/documentation/urls/get-started
 *
 * Avoid `.../place/?q=place_id:...` — it often shows the raw token instead of the listing.
 */

/** Strip Places API (New) resource prefix so Maps accepts the id. */
export function normalizeGooglePlaceId(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  return t.replace(/^places\//, "");
}

export function isManualPlaceId(placeId: string): boolean {
  return placeId.trim().startsWith("manual-");
}

export function googleMapsListingUrl(placeId: string, label?: string | null): string {
  const id = normalizeGooglePlaceId(placeId);
  const u = new URL("https://www.google.com/maps/search/");
  u.searchParams.set("api", "1");
  u.searchParams.set("query_place_id", id);
  const q = label?.trim();
  if (q) u.searchParams.set("query", q);
  return u.toString();
}

/** Opens Google Maps directions to a place (by place id + optional human label). */
export function googleMapsDirectionsUrl(
  placeId: string,
  destinationLabel?: string | null
): string {
  const id = normalizeGooglePlaceId(placeId);
  const u = new URL("https://www.google.com/maps/dir/");
  u.searchParams.set("api", "1");
  u.searchParams.set("destination_place_id", id);
  const d = destinationLabel?.trim();
  if (d) u.searchParams.set("destination", d);
  return u.toString();
}

function joinedLabel(
  name: string,
  address?: string | null,
  city?: string | null,
  state?: string | null
): string {
  const loc = [city, state].filter(Boolean).join(", ");
  return [name.trim(), address?.trim(), loc].filter(Boolean).join(" · ");
}

/** Resolve a working listing URL for CRM / search rows (handles manual leads). */
export function resolveGoogleMapsListingUrl(input: {
  placeId: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  lat?: number | null;
  lng?: number | null;
  googleMapsUrl?: string | null;
}): string | null {
  const { placeId, name, address, city, state, lat, lng, googleMapsUrl } = input;
  if (!placeId.trim()) return googleMapsUrl?.trim() || null;

  if (!isManualPlaceId(placeId)) {
    return googleMapsListingUrl(placeId, joinedLabel(name, address, city, state));
  }

  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    const u = new URL("https://www.google.com/maps/search/");
    u.searchParams.set("api", "1");
    u.searchParams.set("query", `${lat},${lng}`);
    return u.toString();
  }

  const textQ = [name, address, city, state].filter((x) => x && String(x).trim()).join(" ");
  if (textQ.trim()) {
    const u = new URL("https://www.google.com/maps/search/");
    u.searchParams.set("api", "1");
    u.searchParams.set("query", textQ.trim());
    return u.toString();
  }

  return googleMapsUrl?.trim() || null;
}

export function resolveGoogleMapsDirectionsUrl(input: {
  placeId: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  lat?: number | null;
  lng?: number | null;
}): string | null {
  const { placeId, name, address, city, state, lat, lng } = input;
  if (!placeId.trim()) return null;

  const dest = joinedLabel(name, address, city, state);

  if (!isManualPlaceId(placeId)) {
    return googleMapsDirectionsUrl(placeId, dest || name);
  }

  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    const u = new URL("https://www.google.com/maps/dir/");
    u.searchParams.set("api", "1");
    u.searchParams.set("destination", `${lat},${lng}`);
    return u.toString();
  }

  if (dest.trim()) {
    const u = new URL("https://www.google.com/maps/dir/");
    u.searchParams.set("api", "1");
    u.searchParams.set("destination", dest.trim());
    return u.toString();
  }

  return null;
}
