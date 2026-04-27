import "./normalize-env-auth";

/**
 * Canonical site origin for absolute URLs (email links, redirects).
 * Prefer AUTH_URL; on Vercel fall back to VERCEL_URL.
 */
export function getAppOrigin(): string {
  const authUrl = process.env.AUTH_URL?.replace(/\/$/, "").trim();
  if (authUrl) return authUrl;
  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "").trim();
  if (vercel) {
    return vercel.startsWith("http") ? vercel : `https://${vercel}`;
  }
  return "http://localhost:3000";
}
