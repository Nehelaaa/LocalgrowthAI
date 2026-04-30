import type { MetadataRoute } from "next";

const base = process.env.AUTH_URL?.replace(/\/$/, "") || "https://www.localleadster.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/for/freelancers`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/for/agencies`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/for/sales`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/for/realtors`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}

