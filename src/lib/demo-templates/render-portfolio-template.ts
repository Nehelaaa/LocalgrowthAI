import fs from "node:fs";
import path from "node:path";
import { formatBusinessLocation } from "@/lib/format-business-location";
import {
  nicheCategoryLabel,
  resolveDemoNicheCategory,
} from "@/lib/demo-templates/niche-match";
import { templatesForNiche } from "@/lib/demo-templates/template-registry";
import type { DemoWebsiteInput } from "@/lib/demo-website/types";
import type { DemoTemplateVars, TemplateManifestEntry } from "@/lib/demo-templates/types";
import { preparePortfolioHtml } from "@/lib/demo-templates/prepare-html";

const TEMPLATE_DIR = path.join(process.cwd(), "src/lib/demo-templates");

function loadManifest(): TemplateManifestEntry[] {
  const manifestPath = path.join(TEMPLATE_DIR, "sources.json");
  if (!fs.existsSync(manifestPath)) return [];
  return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as TemplateManifestEntry[];
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function resolveNicheCategory(input: DemoWebsiteInput) {
  return resolveDemoNicheCategory(input);
}

/** Pick a portfolio template that matches the business niche (salon → salon site, auto → auto site, etc.). */
export function pickTemplateId(input: DemoWebsiteInput): string | null {
  const manifest = loadManifest();
  if (manifest.length === 0) return null;

  const available = new Set(manifest.map((m) => m.id));
  const category = resolveDemoNicheCategory(input);
  const pool = templatesForNiche(category).filter(
    (id) => available.has(id) && !UNUSABLE_TEMPLATES.has(id)
  );

  if (pool.length === 0) {
    const fallback = templatesForNiche("local_business").filter(
      (id) => available.has(id) && !UNUSABLE_TEMPLATES.has(id)
    );
    if (fallback.length === 0) return manifest[0]?.id ?? null;
    const idx = hashString(input.name) % fallback.length;
    return fallback[idx]!;
  }

  const idx = hashString(`${input.name}|${category}`) % pool.length;
  return pool[idx]!;
}

/** Skip SPA/Wix shells that cannot render without client JS. */
const UNUSABLE_TEMPLATES = new Set(["mk-detailing", "franklin-tire"]);

/**
 * Prefer the niche-correct portfolio template.
 * If a stored marker points at the wrong niche (e.g. kebab for a bakery), replace it.
 */
export function resolveTemplateIdForBusiness(
  input: DemoWebsiteInput,
  preferredTemplateId?: string | null
): string | null {
  const correct = pickTemplateId(input);
  if (!preferredTemplateId) return correct;

  const category = resolveDemoNicheCategory(input);
  const pool = new Set(templatesForNiche(category));
  if (pool.has(preferredTemplateId) && !UNUSABLE_TEMPLATES.has(preferredTemplateId)) {
    return preferredTemplateId;
  }
  return correct;
}

export function buildTemplateVars(input: DemoWebsiteInput): DemoTemplateVars {
  const location = formatBusinessLocation({
    city: input.city,
    state: input.state,
    address: input.address,
  });
  const phone = input.phone?.trim() ?? "";
  const digits = phone.replace(/\D/g, "");
  const tel = digits ? `+${digits.startsWith("1") ? digits : `1${digits}`}` : "";
  const rating = input.rating != null ? input.rating.toFixed(1) : "5.0";
  const reviews = String(input.reviewCount ?? 0);
  const city = input.city?.trim() ?? location.split(",")[0]?.trim() ?? "";
  const name = input.name.trim() || "Your Business";
  const category = resolveDemoNicheCategory(input);

  return {
    business_name: name,
    business_name_short: name.split(/\s+/).slice(0, 2).join(" "),
    phone: phone || "Call for hours",
    phone_tel: tel || "#contact",
    phone_display: phone || "Call for hours",
    address: input.address?.trim() || location,
    street: input.address?.split(",")[0]?.trim() || input.address?.trim() || "",
    location: location !== "—" ? location : city || "Your area",
    city,
    state: input.state?.trim() ?? "",
    rating,
    review_count: reviews,
    hero_image: input.photoUrl?.trim() || "",
    maps_url: input.googleMapsUrl?.trim() || "#contact",
    category_label: input.businessType?.trim() || nicheCategoryLabel(category),
    tagline_location: location !== "—" ? `Serving ${location}` : "Locally owned & trusted",
    logo_text: name,
    year: String(new Date().getFullYear()),
  };
}

export function applyTemplatePlaceholders(
  html: string,
  vars: DemoTemplateVars
): string {
  let out = html;
  for (const [key, value] of Object.entries(vars)) {
    const token = `{{${key}}}`;
    out = out.split(token).join(value);
  }
  return out;
}

export function loadPortfolioTemplate(templateId: string): string | null {
  const filePath = path.join(TEMPLATE_DIR, "html", `${templateId}.html`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf8");
}

export function listPortfolioTemplates(): TemplateManifestEntry[] {
  return loadManifest();
}

function getTemplateOrigin(templateId: string): string | null {
  const entry = loadManifest().find((m) => m.id === templateId);
  if (!entry?.sourceUrl) return null;
  try {
    return new URL(entry.sourceUrl).origin;
  } catch {
    return null;
  }
}

export async function renderPortfolioTemplate(
  input: DemoWebsiteInput,
  templateId?: string | null
): Promise<string | null> {
  const id = resolveTemplateIdForBusiness(input, templateId);
  if (!id) return null;
  const html = loadPortfolioTemplate(id);
  if (!html) return null;
  const vars = buildTemplateVars(input);
  let rendered = applyTemplatePlaceholders(html, vars);

  const origin = getTemplateOrigin(id);
  if (origin) {
    rendered = await preparePortfolioHtml(rendered, origin, vars);
  }

  return rendered;
}

export function describeTemplatePick(input: DemoWebsiteInput): {
  templateId: string | null;
  nicheCategory: ReturnType<typeof resolveDemoNicheCategory>;
  nicheLabel: string;
} {
  const nicheCategory = resolveDemoNicheCategory(input);
  const templateId = pickTemplateId(input);
  return {
    templateId,
    nicheCategory,
    nicheLabel: nicheCategoryLabel(nicheCategory),
  };
}
