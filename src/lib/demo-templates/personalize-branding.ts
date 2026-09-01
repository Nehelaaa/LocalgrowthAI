import type { DemoTemplateVars } from "@/lib/demo-templates/types";

/** Too generic to replace alone — would break industry copy ("Master Barber", "Auto Repair"). */
const GENERIC_BRAND_WORDS = new Set([
  "auto",
  "salon",
  "barber",
  "shop",
  "rental",
  "property",
  "services",
  "bakery",
  "kebab",
  "expert",
  "crest",
  "grub",
  "leah",
  "noir",
  "maison",
  "limo",
  "spa",
  "tire",
  "food",
  "pet",
  "co",
]);

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function isGenericBrandWord(word: string): boolean {
  return GENERIC_BRAND_WORDS.has(word.toLowerCase().replace(/[^a-z]/g, ""));
}

/** Phrases from the portfolio template that must not appear on generated demos. */
export function expandTemplateBrandPhrases(templateBrandName: string): string[] {
  const decoded = decodeHtmlEntities(templateBrandName).trim();
  if (!decoded) return [];

  const phrases = new Set<string>();
  phrases.add(decoded);
  phrases.add(templateBrandName.trim());

  const words = decoded.split(/\s+/).filter(Boolean);
  const first = words[0] ?? "";

  if (words.length >= 2) {
    phrases.add(`${words[0]} ${words[1]} Shop`);
    phrases.add(`${words.slice(0, 2).join(" ")} Shop`);
  }

  // Any contiguous run of the brand name is still the brand ("Amora Leah" from
  // "Amora Leah Salon"). Without these, replacing only the first word leaves a
  // hybrid like "Bella Hair Leah" — and words parked in GENERIC_BRAND_WORDS to
  // stop over-eager single-word swaps would never be cleaned up at all.
  // Only prefixes of the brand name: "Amora Leah" from "Amora Leah Salon".
  // Trailing runs like "Salon & Spa" are ordinary copy on a salon page and
  // must never be swapped for the lead's name.
  if (!isGenericBrandWord(first)) {
    for (let end = 2; end < words.length; end++) {
      const run = words.slice(0, end);
      if (run.every((w) => /[a-z]/i.test(w))) {
        phrases.add(run.join(" "));
      }
    }
  }

  if (first.length >= 4 && !isGenericBrandWord(first)) {
    phrases.add(first);
    const possessive = first.endsWith("s") ? `${first}'` : `${first}'s`;
    phrases.add(possessive);
  }

  if (words.length >= 2) {
    const distinctiveTail = words
      .slice(1)
      .filter((w) => w.length >= 4 && !isGenericBrandWord(w));
    for (const tail of distinctiveTail) {
      phrases.add(tail);
    }
  }

  return [...phrases]
    .filter((p) => p.length >= 4)
    .sort((a, b) => b.length - a.length);
}

function phrasePattern(phrase: string): RegExp {
  const escaped = escapeRegex(phrase).replace(/\s+/g, "\\s+");
  if (!phrase.includes(" ")) {
    return new RegExp(`\\b${escaped}\\b`, "gi");
  }
  return new RegExp(escaped, "gi");
}

const PROTECTED_URL_RE = /https?:\/\/[^\s"'<>]+/gi;

function protectUrls(html: string): { html: string; urls: string[] } {
  const urls: string[] = [];
  const protectedHtml = html.replace(PROTECTED_URL_RE, (url) => {
    const token = `__LGS_URL_${urls.length}__`;
    urls.push(url);
    return token;
  });
  return { html: protectedHtml, urls };
}

function restoreUrls(html: string, urls: string[]): string {
  let out = html;
  for (let i = 0; i < urls.length; i++) {
    out = out.split(`__LGS_URL_${i}__`).join(urls[i]!);
  }
  return out;
}

/** Replace portfolio sample business names with the lead business across visible copy. */
export function replaceTemplateBrandPhrases(
  html: string,
  templateBrandName: string,
  businessName: string,
  businessShort: string
): string {
  const phrases = expandTemplateBrandPhrases(templateBrandName);
  const firstBrandWord = decodeHtmlEntities(templateBrandName)
    .trim()
    .split(/\s+/)[0];
  const short =
    businessShort.trim() ||
    businessName.trim().split(/\s+/).slice(0, 2).join(" ") ||
    businessName;

  let out = html;
  const { html: protectedHtml, urls } = protectUrls(out);
  out = protectedHtml;

  for (const phrase of phrases) {
    const replacement =
      phrase.length <= firstBrandWord.length + 2 ? short : businessName;
    out = out.replace(phrasePattern(phrase), replacement);
    const htmlPhrase = phrase.replace(/'/g, "&#x27;");
    if (htmlPhrase !== phrase) {
      out = out.replace(phrasePattern(htmlPhrase), replacement);
    }
  }

  if (firstBrandWord && firstBrandWord.length >= 4 && !isGenericBrandWord(firstBrandWord)) {
    out = out.replace(
      new RegExp(`\\b${escapeRegex(firstBrandWord)}\\s+Classic\\b`, "gi"),
      `${short} Classic`
    );
    out = out.replace(
      new RegExp(`\\bin the ${escapeRegex(firstBrandWord)}\\b`, "gi"),
      `in ${short}`
    );
    out = out.replace(
      new RegExp(`\\bat ${escapeRegex(firstBrandWord)}\\b`, "gi"),
      `at ${short}`
    );
    out = out.replace(
      new RegExp(`\\bthe ${escapeRegex(firstBrandWord)}\\b`, "gi"),
      short
    );
  }

  out = restoreUrls(out, urls);
  return out;
}

/** True when the hero H1 is still showing the portfolio template brand, not the lead. */
export function heroShowsTemplateBrand(
  heroPlain: string,
  templateBrandName: string
): boolean {
  const hero = heroPlain.replace(/\.$/, "").toLowerCase();
  const brand = decodeHtmlEntities(templateBrandName).trim().toLowerCase();
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

function splitBusinessWordmark(
  businessName: string,
  templateBrandName: string
): { primary: string; secondary: string } {
  const words = businessName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { primary: "Your", secondary: "BUSINESS" };
  }
  if (words.length === 1) {
    const templateTail = decodeHtmlEntities(templateBrandName)
      .trim()
      .split(/\s+/)
      .slice(1)
      .join(" ")
      .toUpperCase();
    return {
      primary: words[0]!,
      secondary: templateTail || words[0]!.toUpperCase(),
    };
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
  const brandWords = decodeHtmlEntities(templateBrandName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
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

export function findTemplateBrandLeaks(
  html: string,
  templateBrandName: string,
  businessName: string
): string[] {
  const stripped = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "");
  const { html: visible, urls } = protectUrls(stripped);
  const issues: string[] = [];
  const phrases = expandTemplateBrandPhrases(templateBrandName);

  for (const phrase of phrases) {
    if (phrase.length < 4) continue;
    if (businessName.toLowerCase().includes(phrase.toLowerCase())) continue;
    if (phrasePattern(phrase).test(visible)) {
      issues.push(`"${phrase}"`);
    }
  }

  if (!html.includes(businessName) && !html.includes(businessName.replace(/'/g, "&#39;"))) {
    issues.push("missing business name");
  }

  void urls;
  return issues;
}

export function personalizeTemplateBranding(
  html: string,
  templateBrandName: string,
  vars: DemoTemplateVars
): string {
  const name = vars.business_name.trim() || "Your Business";
  const short = vars.business_name_short.trim() || name;
  let out = html;
  out = repairCorruptedReviewCountPlaceholders(out);
  // Hero + logo first — before single-word phrase swaps (e.g. Heights → lead name).
  out = personalizeHeroHeading(out, name, templateBrandName);
  out = personalizeSvgWordmarks(out, name, templateBrandName);
  out = replaceTemplateBrandPhrases(out, templateBrandName, name, short);
  // Last: contact details, so brand-phrase swaps can't reintroduce a source address.
  out = replaceSourceContactDetails(out, vars);
  return out;
}

/**
 * Contact details baked into the source templates as literals rather than
 * `{{placeholders}}`. Without this pass a demo built for an Austin salon still
 * shows the source studio's Massachusetts address, phone and socials — the
 * single most damaging thing to leave on a page a user texts to a prospect.
 *
 * Ordered longest-first so a full address is consumed before its street half.
 */
const SOURCE_CONTACT_LITERALS: { find: string; replaceWith: keyof DemoTemplateVars }[] = [
  { find: "931 Worcester Rd, Framingham Center, MA 01701", replaceWith: "address" },
  { find: "Framingham Center, MA 01701", replaceWith: "location" },
  { find: "931 Worcester Rd", replaceWith: "street" },
  { find: "Framingham Center", replaceWith: "city" },
  { find: "Framingham, Massachusetts", replaceWith: "location" },
  { find: "Framingham", replaceWith: "city" },
  { find: "Worcester Rd", replaceWith: "street" },
  { find: "MetroWest", replaceWith: "city" },
  { find: "Massachusetts", replaceWith: "state" },
  { find: "Leominster, MA", replaceWith: "location" },
  { find: "Leominster", replaceWith: "city" },
  { find: "(508) 000-0000", replaceWith: "phone_display" },
  { find: "508-000-0000", replaceWith: "phone_display" },
  { find: "(978) 401-1428", replaceWith: "phone_display" },
  { find: "978-401-1428", replaceWith: "phone_display" },
  { find: "9784011428", replaceWith: "phone_display" },
];

/** Social handles from the source businesses — replaced with the lead's own handle-ish slug. */
const SOURCE_SOCIAL_HANDLES = [
  "amoraleahbeautysalon",
  "mnandisalon",
];

/**
 * Real inboxes belonging to the source businesses. These are live personal
 * addresses, so they must never ship on a demo page built for someone else.
 */
const SOURCE_EMAILS = [
  "mnandixthandi@gmail.com",
  "franklintireautoinfo@gmail.com",
];

/** `Bella Hair Studio` → `bellahairstudio`, for stand-in social handles. */
function socialSlug(businessName: string): string {
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return slug || "yourbusiness";
}

/**
 * Swap source-template contact details for the lead's real ones.
 * Runs after brand-name personalization so name swaps never re-introduce them.
 */
export function replaceSourceContactDetails(
  html: string,
  vars: DemoTemplateVars
): string {
  let out = html;

  for (const { find, replaceWith } of SOURCE_CONTACT_LITERALS) {
    const value = (vars[replaceWith] ?? "").toString().trim();
    // An empty lead value would blank the page's contact block — leave the
    // template text alone rather than render an empty address line.
    if (!value) continue;
    out = out.split(find).join(value);
    // Map embeds and share links carry the same address percent-encoded.
    const encodedFind = encodeURIComponent(find);
    if (encodedFind !== find) {
      out = out.split(encodedFind).join(encodeURIComponent(value));
    }
  }

  const handle = socialSlug(vars.business_name);
  for (const source of SOURCE_SOCIAL_HANDLES) {
    out = out.split(source).join(handle);
  }

  const standInEmail = `hello@${handle}.com`;
  for (const source of SOURCE_EMAILS) {
    out = out.split(source).join(standInEmail);
  }

  return out;
}

/**
 * Contact-detail leaks the brand-name audit cannot see: a source address,
 * phone or social handle that survived personalization.
 */
export function findContactDetailLeaks(
  html: string,
  vars: DemoTemplateVars
): string[] {
  const visible = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "");
  const issues: string[] = [];

  for (const { find, replaceWith } of SOURCE_CONTACT_LITERALS) {
    // Only a literal we would actually have replaced counts as a leak.
    if (!(vars[replaceWith] ?? "").toString().trim()) continue;
    if (visible.includes(find)) issues.push(`"${find}"`);
    const encodedFind = encodeURIComponent(find);
    if (encodedFind !== find && html.includes(encodedFind)) {
      issues.push(`"${find}" (url-encoded)`);
    }
  }
  for (const source of SOURCE_SOCIAL_HANDLES) {
    // Match the handle as a whole slug only: a lead whose own slug happens to
    // contain it (e.g. "acmetestmnandisalon") has already been personalized.
    const pattern = new RegExp(
      `(?<![a-z0-9])${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z0-9])`,
      "i"
    );
    if (pattern.test(html)) issues.push(`"@${source}"`);
  }
  for (const source of SOURCE_EMAILS) {
    if (html.includes(source)) issues.push(`"${source}"`);
  }

  return [...new Set(issues)];
}
