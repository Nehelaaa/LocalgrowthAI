import handler from "./src/proxy";

export default handler;

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

