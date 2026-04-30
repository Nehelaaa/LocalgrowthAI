import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

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
  const allowed =
    (process.env.AUTH_URL?.replace(/\/$/, "") && new URL(process.env.AUTH_URL).origin) ||
    request.nextUrl.origin;
  if (origin !== allowed) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  return null;
}

export function safeErrorMessage(): string {
  return "Request failed";
}

