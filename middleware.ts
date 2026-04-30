import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function ownerEmailAllowlist(): Set<string> {
  const raw = `${process.env.OWNER_EMAIL ?? ""},${process.env.OWNER_EMAILS ?? ""}`;
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    // Stripe POST endpoints expect JSON — redirect returns HTML and breaks fetch().json().
    if (path.startsWith("/api/stripe/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const u = new URL("/login", req.nextUrl);
    u.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(u);
  }

  // Owner-only area: allow ADMIN, or allowlisted email(s).
  if (path.startsWith("/owner") || path.startsWith("/api/owner/")) {
    const role = String((token as any)?.role ?? "USER");
    const email = String((token as any)?.email ?? "").trim().toLowerCase();
    const owners = ownerEmailAllowlist();
    if (role !== "ADMIN" && (owners.size === 0 || !owners.has(email))) {
      return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/owner/:path*",
    "/onboarding",
    "/api/owner/:path*",
    "/api/places/:path*",
    "/api/export/:path*",
    "/api/stripe/checkout",
    "/api/stripe/portal",
  ],
};

