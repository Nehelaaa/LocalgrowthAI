import { renderPortfolioTemplate, listPortfolioTemplates } from "../src/lib/demo-templates/render-portfolio-template.ts";
import { findTemplateBrandLeaks } from "../src/lib/demo-templates/personalize-branding.ts";
import { pickTemplateId } from "../src/lib/demo-templates/render-portfolio-template.ts";
import { TEMPLATES_BY_NICHE } from "../src/lib/demo-templates/template-registry.ts";

const SKIP = new Set(["mk-detailing", "franklin-tire"]);
const activeIds = new Set(
  Object.values(TEMPLATES_BY_NICHE).flat().filter((id) => !SKIP.has(id))
);

const NICHE_CASES = [
  { name: "Vincent's Barbershop", businessType: "barber shop", city: "Boston", state: "MA" },
  { name: "Chepes Bakery", businessType: "bakery", city: "Waltham", state: "MA" },
  { name: "Mike's Auto Garage", businessType: "auto repair", city: "Milford", state: "MA" },
  { name: "Luxe Hair Studio", businessType: "hair salon", city: "Framingham", state: "MA" },
  { name: "WestWilshireNeuro", businessType: "neurology clinic", city: "Los Angeles", state: "CA" },
];

let failed = 0;

console.log("=== Per-template brand leak audit ===\n");
for (const t of listPortfolioTemplates()) {
  if (!activeIds.has(t.id) || SKIP.has(t.id)) continue;
  const businessName = `Acme Test ${t.id}`;
  const html = await renderPortfolioTemplate(
    {
      name: businessName,
      businessType: "local business",
      city: "Boston",
      state: "MA",
      phone: "(617) 555-0100",
      rating: 4.8,
      reviewCount: 42,
    },
    t.id
  );
  const issues = findTemplateBrandLeaks(html ?? "", t.name, businessName);
  if (issues.length) {
    console.log(`✗ ${t.id}: ${issues.join(", ")}`);
    failed++;
  } else {
    console.log(`✓ ${t.id}`);
  }
}

console.log("\n=== Niche lead samples ===\n");
for (const input of NICHE_CASES) {
  const templateId = pickTemplateId(input);
  const template = listPortfolioTemplates().find((t) => t.id === templateId);
  const html = await renderPortfolioTemplate(input, templateId);
  if (!html?.includes(input.name)) {
    console.log(`✗ ${input.name} → ${templateId}: missing business name`);
    failed++;
    continue;
  }
  const issues = findTemplateBrandLeaks(html, template?.name ?? "", input.name);
  if (issues.length) {
    console.log(`✗ ${input.name} → ${templateId}: ${issues.join(", ")}`);
    failed++;
  } else {
    console.log(`✓ ${input.name} → ${templateId}`);
  }
}

console.log(failed ? `\n${failed} branding leak(s)` : "\nNo branding leaks detected.");
process.exit(failed ? 1 : 0);
