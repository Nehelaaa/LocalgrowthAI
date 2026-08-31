/**
 * Pure same-origin / CSRF decision (no Next.js imports).
 */

function parseExtraOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function wwwHostnameVariants(hostname: string): string[] {
  if (hostname === "localhost" || hostname === "127.0.0.1") return [hostname];
  if (/^[0-9.]+$/.test(hostname) || hostname.includes(":")) return [hostname];
  if (hostname.startsWith("www.")) return [hostname, hostname.slice(4)];
  return [hostname, `www.${hostname}`];
}

function originsFromBase(origin: string): string[] {
  try {
    const u = new URL(origin);
    const out = new Set<string>();
    for (const h of wwwHostnameVariants(u.hostname)) {
      const nu = new URL(origin);
      nu.hostname = h;
      out.add(nu.origin);
    }
    return [...out];
  } catch {
    return [];
  }
}

function tryParseOrigin(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    return new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`).origin;
  } catch {
    return null;
  }
}

export function collectAllowedOrigins(opts: {
  requestOrigin: string;
  authUrl?: string | null;
  allowedOriginsEnv?: string | null;
}): Set<string> {
  const allowed = new Set<string>();
  const add = (base: string) => {
    for (const o of originsFromBase(base)) allowed.add(o);
  };
  add(opts.requestOrigin);
  const auth = opts.authUrl?.trim();
  if (auth) {
    const o = tryParseOrigin(auth);
    if (o) add(o);
  }
  for (const extra of parseExtraOrigins(opts.allowedOriginsEnv ?? undefined)) {
    const o = tryParseOrigin(extra);
    if (o) add(o);
  }
  return allowed;
}

export type SameOriginDecision = "allow" | "deny";

/**
 * CSRF decision for cookie-auth JSON POSTs.
 * - Deny foreign Origin / cross-site Sec-Fetch-Site / foreign Referer
 * - Allow missing Origin+Referer (curl / server clients)
 */
export function decideSameOrigin(opts: {
  requestOrigin: string;
  originHeader?: string | null;
  refererHeader?: string | null;
  secFetchSite?: string | null;
  authUrl?: string | null;
  allowedOriginsEnv?: string | null;
}): SameOriginDecision {
  const allowed = collectAllowedOrigins({
    requestOrigin: opts.requestOrigin,
    authUrl: opts.authUrl,
    allowedOriginsEnv: opts.allowedOriginsEnv,
  });

  const origin = opts.originHeader?.trim();
  if (origin) {
    return allowed.has(origin) ? "allow" : "deny";
  }

  const secFetchSite = opts.secFetchSite?.toLowerCase();
  if (secFetchSite === "cross-site") return "deny";

  const referer = opts.refererHeader?.trim();
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      return allowed.has(refOrigin) ? "allow" : "deny";
    } catch {
      return "deny";
    }
  }

  return "allow";
}
