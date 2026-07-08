import { renderPortfolioTemplate, pickTemplateId, listPortfolioTemplates } from "../src/lib/demo-templates/render-portfolio-template.ts";
import { resolveDemoNicheCategory } from "../src/lib/demo-templates/niche-match.ts";
import { TEMPLATES_BY_NICHE } from "../src/lib/demo-templates/template-registry.ts";

/** Templates that are JS-only shells — excluded from niche pools but listed in manifest. */
const SKIP_TEMPLATE_IDS = new Set(["mk-detailing", "franklin-tire"]);

const cases = [
  { name: "Mel Berkachi Barbershop", businessType: "barber shop", city: "Watertown", state: "MA", phone: "(617) 555-0199", rating: 4.8, reviewCount: 120, photoUrl: "https://example.com/p.jpg" },
  { name: "Luxe Hair Studio", businessType: "hair salon", city: "Framingham", state: "MA", rating: 4.7, reviewCount: 89 },
  { name: "Mike Auto Repair", businessType: "auto repair", city: "Milford", state: "MA", rating: 4.6, reviewCount: 200 },
  { name: "Expert Garage", businessType: "mechanic", city: "Waltham", state: "MA" },
  { name: "Sultan Grill", businessType: "restaurant", city: "Boston", state: "MA" },
  { name: "Morning Crumb Bakery", businessType: "bakery", city: "Lexington", state: "MA" },
  { name: "Chepes Bakery", businessType: "bakery", city: "Waltham", state: "MA" },
  { name: "Paws & Claws Pet Shop", businessType: "pet store", city: "Cambridge", state: "MA" },
  { name: "Green Lawn Landscaping", businessType: "landscaping", city: "Newton", state: "MA" },
  { name: "Bright Smile Dental", businessType: "dentist", city: "Arlington", state: "MA" },
  { name: "Metro Realty Group", businessType: "real estate agent", city: "Boston", state: "MA" },
];

function validate(html, input) {
  const issues = [];
  if (!html || html.length < 3000) issues.push("too short");
  if (html && /<script\b/i.test(html)) issues.push("scripts");
  if (html && !html.includes(input.name)) issues.push("missing name");
  const bodyHtml = html?.replace(/<style[\s\S]*?<\/style>/gi, "") ?? "";
  if (html && !/<main|<section/i.test(bodyHtml)) issues.push("no content");
  // Styles must be present (inlined stylesheet or external link still ok)
  if (html && !/<style\b/i.test(html) && !/rel=["']stylesheet["']/i.test(html)) {
    issues.push("no css");
  }
  // Must NOT rewrite CSS into #contact
  if (html && /href="#contact"[^>]*>[\s\S]{0,40}stylesheet|stylesheet[\s\S]{0,80}href="#contact"/i.test(html)) {
    issues.push("css rewritten");
  }
  if (html && /href="#contact"\.css/i.test(html)) issues.push("css broken href");
  // Mobile drawer should stay collapsed
  if (html && /max-h-0 opacity-100/i.test(html)) issues.push("mobile menu forced open");
  if (html && !/<base\s+href=/i.test(html)) issues.push("no base");
  if (html && !html.includes("localleadster-demo-fix")) issues.push("no fix css");
  return issues;
}

let failed = 0;
console.log("=== Niche routing ===\n");
for (const input of cases) {
  const cat = resolveDemoNicheCategory(input);
  const tid = pickTemplateId(input);
  const html = await renderPortfolioTemplate(input, tid);
  const issues = validate(html, input);
  const ok = issues.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${input.businessType.padEnd(18)} → ${cat.padEnd(14)} → ${tid}${issues.length ? " [" + issues.join(", ") + "]" : ""}`);
}

console.log("\n=== Active templates ===\n");
const sample = { name: "Sample Local Co", businessType: "local business", city: "Boston", state: "MA", phone: "(617) 555-0100", rating: 4.9, reviewCount: 50 };
const activeIds = new Set(
  Object.values(TEMPLATES_BY_NICHE)
    .flat()
    .filter((id) => !SKIP_TEMPLATE_IDS.has(id))
);
for (const t of listPortfolioTemplates()) {
  if (SKIP_TEMPLATE_IDS.has(t.id)) {
    console.log(`⊘ ${t.id} (skipped)`);
    continue;
  }
  if (!activeIds.has(t.id)) {
    console.log(`⊘ ${t.id} (not in pools)`);
    continue;
  }
  const html = await renderPortfolioTemplate(sample, t.id);
  const issues = validate(html, sample);
  if (issues.length) {
    console.log(`✗ ${t.id}: ${issues.join(", ")}`);
    failed++;
  } else {
    const inlined = (html?.match(/data-inlined-from=/g) || []).length;
    console.log(`✓ ${t.id} (${Math.round((html?.length ?? 0) / 1024)}KB${inlined ? `, ${inlined} css inlined` : ""})`);
  }
}

console.log(failed ? `\n${failed} failure(s)` : "\nAll checks passed.");
process.exit(failed ? 1 : 0);
