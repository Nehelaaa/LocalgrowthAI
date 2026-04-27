import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    const u = new URL("/login", req.nextUrl);
    u.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(u);
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
