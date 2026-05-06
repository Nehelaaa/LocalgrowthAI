/**
 * Canonical origin for metadata, sitemap, robots, and JSON-LD.
 * Order: NEXT_PUBLIC_SITE_URL (public marketing URL) → AUTH_URL (must match OAuth / cookies host) → default.
 * If AUTH_URL is apex (no www), prefer a 301 from www → apex in hosting so sign-in and SEO share one host.
 */
export function getSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      /* fall through */
    }
  }
  const auth = process.env.AUTH_URL?.trim().replace(/\/$/, "");
  if (auth) {
    try {
      return new URL(auth).origin;
    } catch {
      /* fall through */
    }
  }
  return "https://localleadster.com";
}

export function getMetadataBase(): URL {
  return new URL(getSiteOrigin());
}
