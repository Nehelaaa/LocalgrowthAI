import { resolveDemoNicheCategory } from "../src/lib/demo-templates/niche-match.ts";
import {
  pickTemplateId,
  renderPortfolioTemplate,
  resolveTemplateIdForBusiness,
} from "../src/lib/demo-templates/render-portfolio-template.ts";

const bakery = {
  name: "Chepes Bakery",
  businessType: "bakery",
  city: "Waltham",
  state: "MA",
  phone: "(617) 555-0188",
  address: "100 Main St",
  rating: 4.6,
  reviewCount: 42,
};

const cat = resolveDemoNicheCategory(bakery);
const tid = pickTemplateId(bakery);
const forcedWrong = resolveTemplateIdForBusiness(bakery, "grub-kebab");
const html = await renderPortfolioTemplate(bakery);
if (!html) throw new Error("no html");

const issues = [];
if (cat !== "bakery") issues.push(`category=${cat}`);
if (tid !== "nouve-bakery") issues.push(`pick=${tid}`);
if (forcedWrong !== "nouve-bakery") issues.push(`override=${forcedWrong}`);
if (!html.includes("Chepes Bakery")) issues.push("missing name");
if (/kebab|shawarma|MIDDLE EASTERN/i.test(html)) issues.push("kebab copy");
if (!/<style\b/i.test(html)) issues.push("no inlined style");
if (/href="#contact"[^>]*styles-|styles-[^"]+\.css[^>]*href="#/i.test(html)) {
  issues.push("css link rewritten");
}
if (/rel=["']stylesheet["'][^>]*href="#contact"/i.test(html)) issues.push("stylesheet is #contact");

console.log({
  cat,
  tid,
  sizeKb: Math.round(html.length / 1024),
  inlined: (html.match(/data-inlined-from=/g) || []).length,
  stylesheets: (html.match(/rel=["']stylesheet["']/gi) || []).length,
  styleTags: (html.match(/<style\b/gi) || []).length,
});

if (issues.length) {
  console.error("FAIL", issues);
  process.exit(1);
}
console.log("PASS — Chepes Bakery styled bakery template");
