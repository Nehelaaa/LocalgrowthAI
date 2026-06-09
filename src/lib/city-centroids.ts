/** Fallback city centers (lat/lng) when leads lack exact coordinates. */
const US_CITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  ashland: { lat: 42.2612, lng: -71.4634 },
  boston: { lat: 42.3601, lng: -71.0589 },
  framingham: { lat: 42.2793, lng: -71.4162 },
  lexington: { lat: 42.4473, lng: -71.2245 },
  marlborough: { lat: 42.3459, lng: -71.5523 },
  milford: { lat: 42.1398, lng: -71.5162 },
  newton: { lat: 42.337, lng: -71.2092 },
  "west newton": { lat: 42.3489, lng: -71.2278 },
  southborough: { lat: 42.3057, lng: -71.5245 },
  waltham: { lat: 42.3765, lng: -71.2356 },
  westborough: { lat: 42.2695, lng: -71.6162 },
  worcester: { lat: 42.2626, lng: -71.8023 },
  natick: { lat: 42.2834, lng: -71.3468 },
  sudbury: { lat: 42.3834, lng: -71.4162 },
  hopkinton: { lat: 42.2287, lng: -71.5226 },
  shrewsbury: { lat: 42.2959, lng: -71.7128 },
  northborough: { lat: 42.3195, lng: -71.6412 },
  hudson: { lat: 42.3918, lng: -71.5662 },
  acton: { lat: 42.4851, lng: -71.4328 },
  concord: { lat: 42.4604, lng: -71.3489 },
};

function cityKey(city: string): string {
  return city.trim().toLowerCase();
}

export function getStaticCityCoordinates(
  city: string
): { lat: number; lng: number } | null {
  return US_CITY_CENTROIDS[cityKey(city)] ?? null;
}

export function deriveCityCentroids(
  entries: { city: string; lat: number; lng: number }[]
): Map<string, { lat: number; lng: number }> {
  const sums = new Map<string, { latSum: number; lngSum: number; n: number }>();

  for (const { city, lat, lng } of entries) {
    const key = cityKey(city);
    const prev = sums.get(key) ?? { latSum: 0, lngSum: 0, n: 0 };
    sums.set(key, { latSum: prev.latSum + lat, lngSum: prev.lngSum + lng, n: prev.n + 1 });
  }

  const centroids = new Map<string, { lat: number; lng: number }>();
  for (const [key, { latSum, lngSum, n }] of sums) {
    centroids.set(key, { lat: latSum / n, lng: lngSum / n });
  }
  return centroids;
}

export function resolveCityCoordinates(
  city: string,
  state: string | null | undefined,
  derived: Map<string, { lat: number; lng: number }>
): { lat: number; lng: number } | null {
  const key = cityKey(city);
  return derived.get(key) ?? getStaticCityCoordinates(city);
}
