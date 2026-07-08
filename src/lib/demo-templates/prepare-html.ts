import type { DemoTemplateVars } from "@/lib/demo-templates/types";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeSvgText(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Inline SVG logo so demos show the lead business name instead of the template logo file. */
export function businessLogoDataUri(name: string): string {
  const label = escapeSvgText(name.trim().slice(0, 28) || "Your Business");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="64" viewBox="0 0 240 64">
    <rect width="240" height="64" rx="8" fill="#111827"/>
    <text x="12" y="40" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="700" fill="#ffffff">${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function decodeNextImagePath(nextImageUrl: string): string | null {
  const match = nextImageUrl.match(/[?&]url=([^&"'\s]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function toAbsoluteAsset(origin: string, pathOrUrl: string): string {
  if (!pathOrUrl || pathOrUrl.startsWith("data:") || pathOrUrl.startsWith("http")) {
    return pathOrUrl;
  }
  const base = origin.replace(/\/$/, "");
  return pathOrUrl.startsWith("/") ? `${base}${pathOrUrl}` : `${base}/${pathOrUrl}`;
}

/** Turn Next.js image optimizer URLs into direct asset URLs on the template host. */
function resolveNextImageUrl(origin: string, nextImageUrl: string): string {
  const path = decodeNextImagePath(nextImageUrl);
  if (!path) return toAbsoluteAsset(origin, nextImageUrl);
  return toAbsoluteAsset(origin, path);
}

export function absolutizeTemplateUrls(html: string, origin: string): string {
  const base = origin.replace(/\/$/, "");

  let out = html
    .replace(/\shref="\/(?!\/)/g, ` href="${base}/`)
    .replace(/\ssrc="\/(?!\/)/g, ` src="${base}/`)
    .replace(/\ssrcset="\/(?!\/)/gi, ` srcset="${base}/`)
    .replace(/imageSrcSet="\/(?!\/)/gi, ` imageSrcSet="${base}/`)
    .replace(/url\(\/(?!\/)/g, `url(${base}/`);

  out = out.replace(/"(\/_next\/image\?[^"]+)"/g, (_m, url: string) => {
    return `"${resolveNextImageUrl(base, url)}"`;
  });

  out = out.replace(
    /(srcset|imageSrcSet)="([^"]+)"/gi,
    (_m, attr: string, value: string) => {
      const fixed = value
        .split(",")
        .map((part) => {
          const trimmed = part.trim();
          const space = trimmed.indexOf(" ");
          const url = space === -1 ? trimmed : trimmed.slice(0, space);
          const descriptor = space === -1 ? "" : trimmed.slice(space);
          if (url.startsWith("/_next/image")) {
            return `${resolveNextImageUrl(base, url)}${descriptor}`;
          }
          if (url.startsWith("/")) {
            return `${base}${url}${descriptor}`;
          }
          return trimmed;
        })
        .join(", ");
      return `${attr}="${fixed}"`;
    }
  );

  return out;
}

/** Catch any remaining root-relative image URLs after other passes. */
export function fixRemainingRelativeImages(html: string, origin: string): string {
  const base = origin.replace(/\/$/, "");
  let out = html;

  out = out.replace(
    /\ssrc="\/(?!\/)([^"]+)"/gi,
    (_m, path: string) => ` src="${base}/${path.replace(/^\//, "")}"`
  );
  out = out.replace(
    /\ssrcset="\/(?!\/)/gi,
    ` srcset="${base}/`
  );
  out = out.replace(
    /imageSrcSet="\/(?!\/)/gi,
    ` imageSrcSet="${base}/`
  );
  out = out.replace(
    /url\(\s*\/(?!\/)([^)]+)\)/gi,
    (_m, path: string) => `url(${base}/${path.replace(/^\//, "")})`
  );

  return out;
}

export function ensureBaseHref(html: string, origin: string): string {
  const base = origin.replace(/\/$/, "") + "/";
  if (/<base\s/i.test(html)) {
    return html.replace(/<base\s+href="[^"]*"/i, `<base href="${base}"`);
  }
  return html.replace(/<head([^>]*)>/i, `<head$1><base href="${base}" />`);
}

/** Next/React hydration on localhost wipes SSR content — serve static HTML only. */
export function stripHydrationScripts(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

/**
 * Reveal only full-page entrance animations.
 * Do NOT open mobile drawers (max-h-0 opacity-0) — that dumps duplicate nav as unstyled lists.
 */
export function revealHiddenSsrContent(html: string): string {
  return html.replace(/style="([^"]*)"/gi, (_m, style: string) => {
    // Keep intentionally collapsed mobile menus closed.
    if (/max-height:\s*0|max-h:\s*0/i.test(style)) return `style="${style}"`;

    let next = style;
    // Clip-path wipes (common on portfolio about/gallery images without JS).
    if (/clip-path:\s*inset/i.test(next)) {
      next = next.replace(/clip-path:\s*inset\([^)]+\)/gi, "clip-path:inset(0)");
    }
    // Entrance fades tied to transform/translateY — show content without JS/framer.
    if (/opacity:\s*0/i.test(next) && /transform:/i.test(next)) {
      next = next
        .replace(/opacity:\s*0(\s|;|$)/gi, "opacity:1$1")
        .replace(/transform:\s*[^;]+/gi, "transform:none");
    } else if (/opacity:\s*0/i.test(next)) {
      next = next.replace(/opacity:\s*0(\s|;|$)/gi, "opacity:1$1");
    }
    return `style="${next}"`;
  });
}

/** Unhide images hidden via clip-path/opacity rules inside inlined stylesheets. */
export function revealHiddenMediaInStyles(html: string): string {
  return html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (full, css: string) => {
    let next = css;
    next = next.replace(/clip-path:\s*inset\([^)]*100%[^)]*\)/gi, "clip-path:inset(0)");
    next = next.replace(/clip-path:\s*inset\(50%\)/gi, "clip-path:inset(0)");
    return full.replace(css, next);
  });
}

export function injectDemoFixStyles(html: string): string {
  const css = `<style id="localleadster-demo-fix">
    html, body { opacity: 1 !important; visibility: visible !important; }
    img[src=""], img:not([src]) { display: none; }
    img, picture, video { opacity: 1 !important; visibility: visible !important; }
    [style*="clip-path:inset(0 0 100%"] { clip-path: inset(0) !important; -webkit-clip-path: inset(0) !important; }
    [style*="clip-path:inset(50%)"] { clip-path: inset(0) !important; -webkit-clip-path: inset(0) !important; }
    /* Keep collapsed mobile drawers closed after static export */
    .max-h-0.opacity-0 { max-height: 0 !important; opacity: 0 !important; overflow: hidden !important; }
  </style>`;
  if (html.includes("localleadster-demo-fix")) return html;
  return html.replace(/<\/head>/i, `${css}</head>`);
}

export function replaceTemplateLogos(html: string, businessName: string): string {
  const logo = businessLogoDataUri(businessName);
  let out = html;
  let headerLogoDone = false;

  out = out.replace(/<header\b[\s\S]*?<\/header>/i, (header) => {
    if (headerLogoDone) return header;
    const updated = header.replace(/<img\b[^>]*>/i, (img) => {
      headerLogoDone = true;
      return img
        .replace(/\ssrc="[^"]*"/i, ` src="${logo}"`)
        .replace(/\ssrcset="[^"]*"/gi, "")
        .replace(/\salt="[^"]*"/i, ` alt="${escapeHtml(businessName)}"`);
    });
    return updated;
  });

  out = out.replace(
    /<img([^>]*(?:logo|brand)[^>]*)>/gi,
    (tag) =>
      tag
        .replace(/\ssrc="[^"]*"/i, ` src="${logo}"`)
        .replace(/\ssrcset="[^"]*"/gi, "")
  );

  out = out.replace(/<img([^>]*src="[^"]*logo[^"]*"[^>]*)>/gi, (tag) => {
    if (tag.includes("data:image/svg+xml")) return tag;
    return tag
      .replace(/\ssrc="[^"]*"/i, ` src="${logo}"`)
      .replace(/\ssrcset="[^"]*"/gi, "");
  });

  return out;
}

function isUsableHeroImage(url: string): boolean {
  const u = url.trim();
  if (!u.startsWith("http")) return false;
  // Places media URLs often 403 without a live key + referrer when used as <img src>.
  if (/places\.googleapis\.com/i.test(u)) return false;
  return true;
}

export function applyHeroPhoto(html: string, heroImage: string, origin: string): string {
  if (!isUsableHeroImage(heroImage)) return html;

  let out = html;
  let replaced = false;

  out = out.replace(
    /<img([^>]*class="[^"]*object-cover[^"]*"[^>]*)>/i,
    (tag) => {
      if (replaced) return tag;
      replaced = true;
      return tag
        .replace(/src="[^"]*"/i, `src="${heroImage}"`)
        .replace(/srcset="[^"]*"/i, "")
        .replace(/sizes="[^"]*"/i, 'sizes="100vw"');
    }
  );

  // Also fix broken relative hero preloads pointing at localhost.
  out = out.replace(/href="\/images\/[^"]+"/g, (m) => toAbsoluteAsset(origin, m.slice(6, -1)));

  return out;
}

/** Keep visitors on the demo page — convert template page nav links into in-page anchors. */
export function rewriteTemplateNavLinks(html: string, origin: string): string {
  const base = origin.replace(/\/$/, "");
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(
    new RegExp(`href="${escaped}/([^"#?]*)"`, "gi"),
    (full, path: string) => {
      const clean = path.replace(/\/$/, "");
      // Never rewrite CSS / JS / fonts / images — that was wiping stylesheets.
      if (
        !clean ||
        /\.(css|js|mjs|map|woff2?|ttf|otf|png|jpe?g|webp|gif|svg|ico|json)(\?|$)/i.test(clean) ||
        /^(assets|_next|static|~|__)/i.test(clean)
      ) {
        return full;
      }
      if (clean === "index.html") return 'href="#top"';
      const first = clean.split("/")[0]!.toLowerCase();
      if (/^(menu|services|about|visit|contact|gallery|booking|home)$/i.test(first)) {
        return `href="#${first === "home" ? "top" : first}"`;
      }
      return 'href="#contact"';
    }
  );
}

/** Fetch external stylesheets and inline them so demos don't depend on host CORS/CDN timing. */
export async function inlineExternalStylesheets(html: string, origin: string): Promise<string> {
  const linkRe = /<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi;
  const links = [...html.matchAll(linkRe)];
  if (links.length === 0) return html;

  let out = html;
  for (const match of links) {
    const tag = match[0];
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    const url = href.startsWith("http") ? href : toAbsoluteAsset(origin, href);
    try {
      const res = await fetch(url, {
        headers: { Accept: "text/css,*/*;q=0.1", "User-Agent": "LocalLeadster-Demo/1.0" },
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) continue;
      let css = await res.text();
      // Absolutize relative url() values inside CSS against the stylesheet URL.
      const cssBase = url.replace(/[^/]+$/, "");
      css = css.replace(/url\(\s*(['"]?)(?!data:|https?:|\/\/)([^'")]+)\1\s*\)/gi, (_m, q, p) => {
        const abs = p.startsWith("/") ? `${origin.replace(/\/$/, "")}${p}` : `${cssBase}${p}`;
        return `url(${q || ""}${abs}${q || ""})`;
      });
      out = out.replace(tag, `<style data-inlined-from="${escapeHtml(url)}">\n${css}\n</style>`);
    } catch {
      // Keep original <link> if fetch fails.
    }
  }
  return out;
}

export async function preparePortfolioHtml(
  html: string,
  origin: string,
  vars: DemoTemplateVars
): Promise<string> {
  let out = html;
  out = ensureBaseHref(out, origin);
  out = absolutizeTemplateUrls(out, origin);
  out = fixRemainingRelativeImages(out, origin);
  out = stripHydrationScripts(out);
  out = revealHiddenSsrContent(out);
  out = replaceTemplateLogos(out, vars.business_name);
  out = applyHeroPhoto(out, vars.hero_image, origin);
  // After absolutize — only rewrite page routes, never css/js/asset hrefs.
  out = rewriteTemplateNavLinks(out, origin);
  out = await inlineExternalStylesheets(out, origin);
  out = revealHiddenMediaInStyles(out);
  out = injectDemoFixStyles(out);

  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(vars.business_name)}</title>`);
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"/i,
    `<meta name="description" content="${escapeHtml(`${vars.business_name} — ${vars.location}. ${vars.category_label}.`)}"`
  );

  return out;
}
