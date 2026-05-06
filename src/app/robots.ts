import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/api/",
          "/dashboard/",
          "/owner/",
          "/onboarding",
          "/login",
          "/auth/",
          "/forgot-password",
          "/reset-password",
          "/demo/",
          "/unauthorized",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/^https?:\/\//, ""),
  };
}

