import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.AUTH_URL?.replace(/\/$/, "") || "https://www.localleadster.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/for/", "/favicon.ico"],
        disallow: [
          "/api/",
          "/dashboard/",
          "/owner/",
          "/onboarding",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/demo/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}

