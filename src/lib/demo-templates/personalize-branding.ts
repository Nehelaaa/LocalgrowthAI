import type { DemoTemplateVars } from "@/lib/demo-templates/types";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the hero H1 is still showing the portfolio template brand, not the lead. */
export function heroShowsTemplateBrand(heroPlain: string, templateBrandName: string): boolean {
  const hero = heroPlain.replace(/\.$/, "").toLowerCase();
  const brand = templateBrandName.trim().toLowerCase();
  if (!hero || !brand) return false;
  if (hero === brand || hero.startsWith(`${brand} `)) return true;

  const heroWords = hero.split(/\s+/).filter(Boolean);
  const brandWords = brand.split(/\s+/).filter(Boolean);
  if (brandWords.length === 0) return false;

  return brandWords.every((word, index) => heroWords[index] === word);
}

function renderHeroWordSpans(businessName: string, originalInner: string): string {
  const spanOpen = originalInner.match(/<span\b[^>]*>/i)?.[0];
  const hadPeriod = plainText(originalInner).endsWith(".");
  const words = businessName.trim().split(/\s+/).filter(Boolean);
  const list = words.length > 0 ? words : ["Your Business"];

  if (!spanOpen) {
    const label = list.join(" ");
    return escapeHtml(hadPeriod && !label.endsWith(".") ? `${label}.` : label);
  }

  return list
    .map((word, index) => {
      const isLast = index === list.length - 1;
      const text =
        isLast && hadPeriod && !word.endsWith(".") ? `${word}.` : word;
      const open = spanOpen
        .replace(/opacity:\s*0/gi, "opacity:1")
        .replace(/translateY\([^)]+\)/gi, "none");
      return `${open}${escapeHtml(text)}</span>`;
    })
    .join("");
}

export function personalizeHeroHeading(
  html: string,
  businessName: string,
  templateBrandName: string
): string {
  let replaced = false;
  return html.replace(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/i, (full, attrs, inner) => {
    if (replaced) return full;
    const heroPlain = plainText(inner);
    if (!heroPlain || heroPlain.includes(businessName)) return full;
    if (!heroShowsTemplateBrand(heroPlain, templateBrandName)) return full;

    replaced = true;
    return `<h1${attrs}>${renderHeroWordSpans(businessName, inner)}</h1>`;
  });
}

function splitBusinessWordmark(businessName: string, templateBrandName: string): {
  primary: string;
  secondary: string;
} {
  const words = businessName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { primary: "Your", secondary: "BUSINESS" };
  }
  if (words.length === 1) {
    const templateTail = templateBrandName
      .trim()
      .split(/\s+/)
      .slice(1)
      .join(" ")
      .toUpperCase();
    return { primary: words[0]!, secondary: templateTail || words[0]!.toUpperCase() };
  }
  return {
    primary: words[0]!,
    secondary: words.slice(1).join(" ").toUpperCase(),
  };
}

function personalizeSvgWordmarkBlock(
  block: string,
  businessName: string,
  templateBrandName: string
): string {
  const { primary, secondary } = splitBusinessWordmark(
    businessName,
    templateBrandName
  );
  const brandWords = templateBrandName.trim().split(/\s+/).filter(Boolean);
  const templatePrimary = brandWords[0] ?? "";
  const templateSecondary = brandWords.slice(1).join(" ").toUpperCase();

  let textIndex = 0;
  return block.replace(/<text([^>]*)>([^<]*)<\/text>/gi, (full, attrs, text) => {
    textIndex += 1;
    const trimmed = text.trim();
    if (textIndex === 1 && trimmed === templatePrimary) {
      return `<text${attrs}>${primary}</text>`;
    }
    if (
      textIndex === 2 &&
      templateSecondary &&
      trimmed.toUpperCase() === templateSecondary
    ) {
      return `<text${attrs}>${secondary}</text>`;
    }
    return full;
  });
}

/** Replace inline SVG wordmarks (common on barber templates) in header + footer. */
export function personalizeSvgWordmarks(
  html: string,
  businessName: string,
  templateBrandName: string
): string {
  let out = html;
  let headerDone = false;
  out = out.replace(/<header\b[\s\S]*?<\/header>/i, (header) => {
    if (headerDone) return header;
    headerDone = true;
    return personalizeSvgWordmarkBlock(header, businessName, templateBrandName);
  });

  let footerDone = false;
  out = out.replace(/<footer\b[\s\S]*?<\/footer>/i, (footer) => {
    if (footerDone) return footer;
    footerDone = true;
    return personalizeSvgWordmarkBlock(footer, businessName, templateBrandName);
  });

  return out;
}

/** Fix import-time accidents where review_count replaced SVG coordinates (e.g. M64 → M{{review_count}}). */
export function repairCorruptedReviewCountPlaceholders(html: string): string {
  return html
    .replace(/M\{\{review_count\}\}/g, "M64")
    .replace(/L\{\{review_count\}\}/g, "L64")
    .replace(/3\.6\{\{review_count\}\}/g, "3.642");
}

export function personalizeTemplateBranding(
  html: string,
  templateBrandName: string,
  vars: DemoTemplateVars
): string {
  const name = vars.business_name.trim() || "Your Business";
  let out = html;
  out = repairCorruptedReviewCountPlaceholders(out);
  out = personalizeHeroHeading(out, name, templateBrandName);
  out = personalizeSvgWordmarks(out, name, templateBrandName);
  return out;
}
