import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

function parseExtraOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Apex and www are treated as the same site for CSRF checks (common production mismatch). */
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

/**
 * Origins allowed to POST to same-origin JSON APIs (checkout, portal, etc.).
 * Includes the host this request hit, AUTH_URL, optional ALLOWED_ORIGINS, and www/apex pairs.
 */
export function allowedRequestOrigins(request: NextRequest): Set<string> {
  const allowed = new Set<string>();
  const add = (base: string) => {
    for (const o of originsFromBase(base)) allowed.add(o);
  };
  add(request.nextUrl.origin);
  const auth = process.env.AUTH_URL?.trim();
  if (auth) {
    const o = tryParseOrigin(auth);
    if (o) add(o);
  }
  for (const extra of parseExtraOrigins(process.env.ALLOWED_ORIGINS)) {
    const o = tryParseOrigin(extra);
    if (o) add(o);
  }
  return allowed;
}

export function rateLimitOr429(request: Request, scope: string) {
  const key = `${scope}:${getClientIdentifier(request)}`;
  const { success, remaining } = rateLimit(key);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  }
  return null;
}

export async function requireSessionOr401() {
  const s = await auth();
  if (!s?.user?.id) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session: s, response: null };
}

/**
 * Basic CSRF protection for same-origin JSON POST routes.
 * - Skips if no Origin header is present (some server-to-server clients).
 * - Stripe webhooks should not call this.
 */
export function enforceSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (!allowedRequestOrigins(request).has(origin)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  return null;
}

export function safeErrorMessage(): string {
  return "Request failed";
}

