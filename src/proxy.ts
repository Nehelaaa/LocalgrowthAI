import { auth } from "@/lib/auth";
import { isOwnerEmail } from "@/lib/owner";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    const path = req.nextUrl.pathname;
    // Stripe POST endpoints expect JSON — redirect returns HTML and breaks fetch().json().
    if (path.startsWith("/api/stripe/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const u = new URL("/login", req.nextUrl);
    u.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(u);
  }

  // Owner-only area: require the OWNER_EMAIL match even if authenticated.
  const path = req.nextUrl.pathname;
  if (path.startsWith("/owner") || path.startsWith("/api/owner/")) {
    const email = req.auth.user?.email ?? "";
    const role = (req.auth.user as unknown as { role?: string } | null)?.role ?? "USER";
    if (role !== "ADMIN" && !isOwnerEmail(email)) {
      return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
    }
  }

  return NextResponse.next();
});

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
