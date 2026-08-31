import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
import { collectAllowedOrigins, decideSameOrigin } from "@/lib/same-origin";

/**
 * Origins allowed to POST to same-origin JSON APIs (checkout, portal, etc.).
 * Includes the host this request hit, AUTH_URL, optional ALLOWED_ORIGINS, and www/apex pairs.
 */
export function allowedRequestOrigins(request: NextRequest): Set<string> {
  return collectAllowedOrigins({
    requestOrigin: request.nextUrl.origin,
    authUrl: process.env.AUTH_URL,
    allowedOriginsEnv: process.env.ALLOWED_ORIGINS,
  });
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
 * - Allows when Origin is an allowed app origin.
 * - Rejects cross-site Sec-Fetch-Site when Origin is absent.
 * - Falls back to Referer origin when Origin is absent (older clients).
 * - Still allows Origin+Referer-less requests (curl/server) so local scripts work.
 * - Stripe webhooks should not call this.
 */
export function enforceSameOrigin(request: NextRequest) {
  const decision = decideSameOrigin({
    requestOrigin: request.nextUrl.origin,
    originHeader: request.headers.get("origin"),
    refererHeader: request.headers.get("referer"),
    secFetchSite: request.headers.get("sec-fetch-site"),
    authUrl: process.env.AUTH_URL,
    allowedOriginsEnv: process.env.ALLOWED_ORIGINS,
  });
  if (decision === "deny") {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  return null;
}

export function safeErrorMessage(): string {
  return "Request failed";
}
