import { googleMapsListingUrl } from "@/lib/google-maps-links";
import type { DemoWebsiteInput } from "@/lib/demo-website/types";
import {
  pickTemplateId,
  renderPortfolioTemplate,
  resolveTemplateIdForBusiness,
  buildTemplateVars,
} from "@/lib/demo-templates/render-portfolio-template";
import {
  absolutizeTemplateUrls,
  ensureBaseHref,
  preparePortfolioHtml,
  revealHiddenSsrContent,
  stripHydrationScripts,
} from "@/lib/demo-templates/prepare-html";
import type { DemoTemplateVars } from "@/lib/demo-templates/types";
import type { Business } from "@prisma/client";

export const TEMPLATE_MARKER_RE = /<!--\s*lgs-template:([a-z0-9-]+)\s*-->/i;

export function stampTemplateMarker(html: string, templateId: string): string {
  if (TEMPLATE_MARKER_RE.test(html)) return html;
  return `<!-- lgs-template:${templateId} -->\n${html}`;
}

export function parseTemplateMarker(html: string): string | null {
  return html.match(TEMPLATE_MARKER_RE)?.[1] ?? null;
}

export function businessToDemoInput(biz: Business): DemoWebsiteInput {
  return {
    name: biz.name,
    businessType: biz.businessType,
    phone: biz.phone,
    address: biz.address,
    city: biz.city,
    state: biz.state,
    rating: biz.rating,
    reviewCount: biz.reviewCount,
    photoUrl: biz.photoUrl,
    googleMapsUrl:
      biz.googleMapsUrl ?? googleMapsListingUrl(biz.placeId, biz.name),
  };
}

function inferOriginFromHtml(html: string): string | null {
  const match = html.match(
    /https:\/\/[a-z0-9.-]+\.(?:vercel\.app|netlify\.app|lovable\.app|com)(?::\d+)?/i
  );
  if (!match) return null;
  try {
    return new URL(match[0]).origin;
  } catch {
    return null;
  }
}

/** Re-render portfolio template with current business data (fixes blank/hydration issues). */
export async function renderStoredDemoHtml(
  storedHtml: string,
  business?: Business | null
): Promise<string> {
  if (business) {
    const input = businessToDemoInput(business);
    const storedId = parseTemplateMarker(storedHtml);
    const templateId = resolveTemplateIdForBusiness(input, storedId);
    if (templateId) {
      const fresh = await renderPortfolioTemplate(input, templateId);
      if (fresh) return fresh;
    }

    const vars = buildTemplateVars(input);
    const origin = inferOriginFromHtml(storedHtml);
    if (origin) {
      let body = storedHtml.replace(TEMPLATE_MARKER_RE, "").trim();
      body = ensureBaseHref(body, origin);
      body = absolutizeTemplateUrls(body, origin);
      body = stripHydrationScripts(body);
      body = revealHiddenSsrContent(body);
      body = await preparePortfolioHtml(body, origin, vars);
      return body;
    }
  }

  return storedHtml.replace(TEMPLATE_MARKER_RE, "").trim();
}

export function resolveTemplateIdForInput(input: DemoWebsiteInput): string | null {
  return pickTemplateId(input);
}

export type { DemoTemplateVars };
