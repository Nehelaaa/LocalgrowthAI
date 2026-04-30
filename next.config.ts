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
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "img-src 'self' https: data:",
      "font-src 'self' https: data:",
      // Next renders JSON-LD via inline <script>, and the demo page includes the Tailwind CDN script.
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://cdn.tailwindcss.com https://accounts.google.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https:",
      "connect-src 'self' https://api.stripe.com https://*.stripe.com https://places.googleapis.com https://oauth2.googleapis.com https://www.googleapis.com https://api.openai.com",
      "frame-src https://js.stripe.com https://accounts.google.com",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  // Hide the dev-only "N" pill (route/Turbopack info) in the corner; errors still show.
  devIndicators: false,
  // With dependencies only under `localgrowth-app/`, we must not resolve CSS
  // and modules from a parent directory that has no `node_modules`.
  // Project root in the IDE is often the repo (parent) folder, while deps live
  // in localgrowth-app/. A matching tailwind in the parent package.json (see
  // ../package.json) lets dev-time PostCSS resolve @import "tailwindcss".
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
