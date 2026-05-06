import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      // Google Places photos (used in dashboard search results)
      { protocol: "https", hostname: "places.googleapis.com", pathname: "/**" },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    const isProd = process.env.NODE_ENV === "production";
    const scriptSrc = [
      "script-src 'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      "https://js.stripe.com",
      "https://cdn.tailwindcss.com",
      "https://accounts.google.com",
      "https://apis.google.com",
    ].join(" ");

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' https: data:",
      "font-src 'self' https: data:",
      // Next renders JSON-LD via inline <script>, and the demo page includes the Tailwind CDN script.
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https:",
      "connect-src 'self' https://api.stripe.com https://*.stripe.com https://places.googleapis.com https://oauth2.googleapis.com https://www.googleapis.com",
      "frame-src https://js.stripe.com https://accounts.google.com",
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join("; ");

    const common: { key: string; value: string }[] = [
      { key: "Content-Security-Policy", value: csp },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
    ];

    /** HSTS on plain HTTP/dev breaks local testing and is meant for HTTPS deployments only. */
    if (isProd) {
      common.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/:path*",
        headers: common,
      },
    ];
  },
  // Hide the dev-only "N" pill (route/Turbopack info) in the corner; errors still show.
  devIndicators: false,
  // Lock Turbopack to this app when the git root has extra lockfiles or parent folders without `node_modules`.
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
