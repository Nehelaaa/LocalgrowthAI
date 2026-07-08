/**
 * Smoke-test portfolio demo templates across niches.
 * Run: node scripts/test-demo-templates.cjs
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const TEMPLATE_DIR = path.join(ROOT, "src/lib/demo-templates");

// Minimal TS path alias shim for node tests
function loadTsModule(relPath) {
  // Use dynamic import via spawning tsx if available, else test via duplicated logic in cjs
  return null;
}

const CASES = [
  {
    label: "Barbershop",
    input: {
      name: "Mel Berkachi's Barbershop",
      businessType: "barber shop",
      phone: "(617) 555-0199",
      address: "12 Main St",
      city: "Watertown",
      state: "MA",
      rating: 4.8,
      reviewCount: 120,
      photoUrl: "https://places.googleapis.com/v1/photo.jpg",
      googleMapsUrl: "https://maps.google.com",
    },
    expectTemplatePool: ["heights-barber", "maison-noir-barber"],
  },
  {
    label: "Hair salon",
    input: {
      name: "Luxe Hair Studio",
      businessType: "hair salon",
      phone: "(508) 555-0100",
      city: "Framingham",
      state: "MA",
      rating: 4.7,
      reviewCount: 89,
    },
    expectTemplatePool: ["amora-salon", "mnandi-salon"],
  },
  {
    label: "Auto repair",
    input: {
      name: "Mike's Auto Repair",
      businessType: "auto repair",
      phone: "(781) 555-0142",
      city: "Milford",
      state: "MA",
      rating: 4.6,
      reviewCount: 200,
    },
    expectTemplatePool: ["rays-auto", "expert-auto", "bills-auto", "franklin-tire"],
  },
  {
    label: "Restaurant",
    input: {
      name: "Sultan Grill",
      businessType: "restaurant",
      city: "Boston",
      state: "MA",
    },
    expectTemplatePool: ["grub-kebab"],
  },
  {
    label: "Bakery",
    input: {
      name: "Morning Crumb Bakery",
      businessType: "bakery",
      city: "Lexington",
      state: "MA",
    },
    expectTemplatePool: ["nouve-bakery", "grub-kebab"],
  },
];

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Inline niche rules (mirror src/lib/demo-templates/niche-match.ts)
function resolveCategory(input) {
  const text = `${input.businessType ?? ""} ${input.name}`.toLowerCase();
  if (/\bbarber|barbershop/.test(text)) return "barber";
  if (/hair salon|salon|spa|beauty|bridal/.test(text)) return "salon";
  if (/detail|car wash/.test(text)) return "detailing";
  if (/car rental|rent a car/.test(text)) return "car_rental";
  if (/limo|chauffeur/.test(text)) return "limo";
  if (/auto repair|mechanic|tire|garage/.test(text)) return "auto_repair";
  if (/bakery|pastry/.test(text)) return "bakery";
  if (/restaurant|pizza|grill|kebab|food/.test(text)) return "restaurant";
  if (/pet/.test(text)) return "pet";
  if (/real estate|realtor/.test(text)) return "real_estate";
  if (/landscap|lawn|contractor|plumb/.test(text)) return "landscaping";
  if (/dental|dentist|medical|clinic/.test(text)) return "healthcare";
  return "local_business";
}

const POOLS = {
  barber: ["heights-barber", "maison-noir-barber"],
  salon: ["amora-salon", "mnandi-salon"],
  auto_repair: ["rays-auto", "expert-auto", "bills-auto", "franklin-tire"],
  detailing: ["mk-detailing", "gleam-ride"],
  restaurant: ["grub-kebab"],
  bakery: ["nouve-bakery", "grub-kebab"],
  pet: ["paw-co"],
  landscaping: ["entoscapes"],
  real_estate: ["crest-property"],
  limo: ["elite-drive"],
  car_rental: ["zoumi-rental"],
  healthcare: ["westneuro", "amora-salon"],
  local_business: ["expert-auto", "rays-auto", "crest-property"],
};

function pickTemplate(input, manifest) {
  const available = new Set(manifest.map((m) => m.id));
  const cat = resolveCategory(input);
  const pool = (POOLS[cat] ?? POOLS.local_business).filter((id) => available.has(id));
  const idx = hashString(`${input.name}|${cat}`) % pool.length;
  return { templateId: pool[idx], category: cat };
}

function validateRenderedHtml(html, input, templateId) {
  const issues = [];
  if (!html || html.length < 5000) issues.push("HTML too short");
  if (/<script\b/i.test(html)) issues.push("Contains script tags");
  if (!html.includes(input.name)) issues.push(`Missing business name "${input.name}"`);
  if (!/<main\b|<section\b/i.test(html)) issues.push("Missing main/section content");
  if ((html.match(/opacity:\s*0\b/gi) || []).length > 8) issues.push("Too many opacity:0 styles");
  if (/"\/_next\//.test(html)) issues.push("Unresolved /_next/ relative URLs");
  if (!/<base\s+href=/i.test(html)) issues.push("Missing base href");
  if (!html.includes("localleadster-demo-fix")) issues.push("Missing demo fix CSS");
  return issues;
}

// Simplified render pipeline (mirrors prepare-html + placeholders)
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildVars(input) {
  const location = [input.city, input.state].filter(Boolean).join(", ") || "—";
  const phone = input.phone ?? "";
  return {
    business_name: escapeHtml(input.name),
    phone: escapeHtml(phone || "Call for hours"),
    location: escapeHtml(location),
    category_label: escapeHtml(input.businessType || "Local business"),
    hero_image: input.photoUrl || "",
    rating: input.rating != null ? input.rating.toFixed(1) : "5.0",
    review_count: String(input.reviewCount ?? 0),
  };
}

function applyPlaceholders(html, vars) {
  let out = html;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

function stripScripts(html) {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

function ensureBase(html, origin) {
  const base = origin.replace(/\/$/, "") + "/";
  if (/<base\s/i.test(html)) return html.replace(/<base\s+href="[^"]*"/i, `<base href="${base}"`);
  return html.replace(/<head([^>]*)>/i, `<head$1><base href="${base}" />`);
}

function absolutize(html, origin) {
  const base = origin.replace(/\/$/, "");
  return html
    .replace(/\ssrc="\/(?!\/)/g, ` src="${base}/`)
    .replace(/\shref="\/(?!\/)/g, ` href="${base}/`)
    .replace(/"(\/_next\/image\?[^"]+)"/g, (_m, url) => {
      const m = url.match(/url=([^&]+)/);
      if (!m) return `"${base}${url}"`;
      return `"${base}${decodeURIComponent(m[1])}"`;
    });
}

function main() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(TEMPLATE_DIR, "sources.json"), "utf8")
  );

  let failed = 0;
  let passed = 0;

  console.log(`Testing ${manifest.length} templates, ${CASES.length} niche cases...\n`);

  for (const c of CASES) {
    const { templateId, category } = pickTemplate(c.input, manifest);
    const inPool = c.expectTemplatePool.includes(templateId);
    if (!inPool) {
      console.log(`✗ ${c.label}: picked ${templateId} (${category}), expected one of ${c.expectTemplatePool.join(", ")}`);
      failed++;
      continue;
    }

    const entry = manifest.find((m) => m.id === templateId);
    const raw = fs.readFileSync(path.join(TEMPLATE_DIR, entry.file), "utf8");
    const origin = new URL(entry.sourceUrl).origin;
    const vars = buildVars(c.input);
    let html = applyPlaceholders(raw, vars);
    html = ensureBase(html, origin);
    html = absolutize(html, origin);
    html = stripScripts(html);
    html = html.replace(/<\/head>/i, '<style id="localleadster-demo-fix">body{opacity:1!important}</style></head>');

    const issues = validateRenderedHtml(html, c.input, templateId);
    if (issues.length) {
      console.log(`✗ ${c.label} → ${templateId}: ${issues.join("; ")}`);
      failed++;
    } else {
      console.log(`✓ ${c.label} → ${templateId} (${category}) — ${Math.round(html.length / 1024)}KB`);
      passed++;
    }
  }

  // Every template file exists and is non-trivial
  for (const entry of manifest) {
    const file = path.join(TEMPLATE_DIR, entry.file);
    if (!fs.existsSync(file)) {
      console.log(`✗ Missing template file: ${entry.file}`);
      failed++;
      continue;
    }
    const size = fs.statSync(file).size;
    if (size < 5000) {
      console.log(`✗ Template too small: ${entry.id} (${size} bytes)`);
      failed++;
    }
  }

  console.log(`\n${passed} case(s) passed, ${failed} failure(s), ${manifest.length} templates on disk.`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
