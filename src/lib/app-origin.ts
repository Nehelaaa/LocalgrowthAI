import { headers } from "next/headers";
import "./normalize-env-auth";

/**
 * Canonical site origin for absolute URLs (email links, redirects).
 * Prefer AUTH_URL; on Vercel fall back to VERCEL_URL; last resort localhost:3000.
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

/**
 * Use in server actions / RSC when AUTH_URL may be cleared in dev: derive origin from
 * the current request (correct port for localhost:3001, etc.).
 */
export async function getAppOriginForRequest(): Promise<string> {
  const fromEnv = process.env.AUTH_URL?.replace(/\/$/, "").trim();
  if (fromEnv) return fromEnv;
  const h = await headers();
  const host =
    h.get("x-forwarded-host")?.split(",")[0]?.trim() || h.get("host") || "";
  if (host) {
    const local =
      host.startsWith("localhost") || host.startsWith("127.");
    const proto =
      h.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      (local ? "http" : "https");
    return `${proto}://${host}`;
  }
  return getAppOrigin();
}
