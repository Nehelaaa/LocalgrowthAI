import { getSiteOrigin } from "@/lib/seo/site";

/**
 * Explicit sitemap response (avoids occasional Next metadata-route failures on some hosts).
 */
export async function GET() {
  const base = getSiteOrigin();
  const now = new Date().toISOString();

  const paths = [
    "/",
    "/register",
    "/contact",
    "/for/freelancers",
    "/for/agencies",
    "/for/sales",
    "/for/realtors",
  ] as const;

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    paths
      .map((p) => {
        const loc = `${base}${p}`;
        const freq = p === "/" ? "weekly" : "monthly";
        const priority = p === "/" ? "1.0" : p === "/register" ? "0.95" : p.startsWith("/for/") ? "0.85" : "0.7";
        return (
          `<url>\n` +
          `  <loc>${escapeXml(loc)}</loc>\n` +
          `  <lastmod>${now}</lastmod>\n` +
          `  <changefreq>${freq}</changefreq>\n` +
          `  <priority>${priority}</priority>\n` +
          `</url>`
        );
      })
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
