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
