/**
 * Makes Auth.js / Google OAuth use a single canonical origin for redirect_uri.
 * Fixes common Vercel mistakes: trailing slash, extra path on AUTH_URL, http on https sites.
 * If AUTH_URL is not set on Vercel, derives it from the deployment (see Vercel env docs).
 *
 * In development, clears AUTH_URL / NEXTAUTH_URL at the end so every module that imports this
 * file (not only auth.ts) cannot leave a pinned .env port — fixes Google redirect_uri_mismatch
 * when Next uses 3001 but .env says localhost:3000. Set AUTH_KEEP_URL=1 to disable.
 */

const isVercel = process.env.VERCEL === "1";

function toOriginOnly(raw: string): string {
  const s = raw.trim();
  if (!s) return s;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  const u = new URL(withScheme);
  let origin = u.origin;
  const isLocal = u.hostname === "localhost" || u.hostname === "127.0.0.1";
  if (isVercel && origin.startsWith("http://") && !isLocal) {
    origin = `https://${u.host}`;
  }
  return origin;
}

/**
 * When AUTH_URL is missing on Vercel, use the host of this deployment so OAuth
 * matches the URL in the address bar. Add in Google Cloud:
 *   https://<this-host>/api/auth/callback/google
 */
function vercelDefaultOrigin(): string | null {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    try {
      return toOriginOnly(
        production.startsWith("http") ? production : `https://${production}`
      );
    } catch {
      /* fall through */
    }
  }
  const u = process.env.VERCEL_URL?.trim();
  if (!u) return null;
  const host = u.replace(/^https?:\/\//i, "").split("/")[0];
  if (!host) return null;
  return `https://${host}`;
}

if (isVercel) {
  const explicit = process.env.AUTH_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
  if (!explicit) {
    const o = vercelDefaultOrigin();
    if (o) {
      process.env.AUTH_URL = o;
    }
  }
}

for (const key of ["AUTH_URL", "NEXTAUTH_URL"] as const) {
  const v = process.env[key]?.trim();
  if (!v) continue;
  try {
    process.env[key] = toOriginOnly(v);
  } catch {
    // leave invalid values to fail loudly elsewhere
  }
}

// Must run after the loop above: drop fixed origins in dev so OAuth uses the request Host (port).
if (process.env.NODE_ENV === "development" && process.env.AUTH_KEEP_URL !== "1") {
  delete process.env.AUTH_URL;
  delete process.env.NEXTAUTH_URL;
}
