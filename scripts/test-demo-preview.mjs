import { renderPortfolioTemplate } from "../src/lib/demo-templates/render-portfolio-template.ts";
import { renderStoredDemoHtml, stampTemplateMarker } from "../src/lib/demo-templates/render-demo-page.ts";
import fs from "node:fs";
import path from "node:path";

const input = {
  name: "Ray's Auto Service",
  businessType: "auto repair",
  phone: "(508) 555-0142",
  address: "45 Main Street",
  city: "Milford",
  state: "MA",
  rating: 4.7,
  reviewCount: 156,
  photoUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200",
  googleMapsUrl: "https://maps.google.com",
};

const templateId = "rays-auto";
const html = renderPortfolioTemplate(input, templateId);
if (!html) throw new Error("No HTML rendered");
const stamped = stampTemplateMarker(html, templateId);

const mockBusiness = {
  placeId: "test",
  name: input.name,
  businessType: input.businessType,
  phone: input.phone,
  address: input.address,
  city: input.city,
  state: input.state,
  rating: input.rating,
  reviewCount: input.reviewCount,
  photoUrl: input.photoUrl,
  googleMapsUrl: input.googleMapsUrl,
};

const rerendered = renderStoredDemoHtml(stamped, mockBusiness);
const out = path.join(process.cwd(), ".tmp-demo-preview.html");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, rerendered);

const checks = {
  noScripts: !/<script\b/i.test(rerendered),
  hasName: rerendered.includes(input.name),
  hasMain: /<main|<section/i.test(rerendered),
  hasBase: /<base\s+href=/i.test(rerendered),
  hasFixCss: rerendered.includes("localleadster-demo-fix"),
  size: rerendered.length,
};
console.log("Preview written to", out);
console.log(checks);
const ok = Object.entries(checks).every(([k, v]) => k === "size" || v === true);
process.exit(ok ? 0 : 1);
