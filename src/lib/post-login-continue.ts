const DEFAULT_NEXT = "/dashboard";

/**
 * Validates `next` for open-redirect safety. Only same-origin relative paths are allowed.
 */
export function safeRelativeAppNextPath(
  raw: string | undefined | null,
  fallback = DEFAULT_NEXT
): string {
  if (raw == null || typeof raw !== "string") return fallback;
  let t = raw.trim();
  try {
    t = decodeURIComponent(t);
  } catch {
    return fallback;
  }
  t = t.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  if (t.includes("://")) return fallback;
  const lower = t.toLowerCase();
  if (lower.startsWith("/auth/continue")) return fallback;
  return t;
}

/** Use as NextAuth `callbackUrl` so we can route owners server-side after session exists. */
export function postLoginContinueUrl(nextPath: string): string {
  const next = safeRelativeAppNextPath(nextPath, DEFAULT_NEXT);
  return `/auth/continue?next=${encodeURIComponent(next)}`;
}
