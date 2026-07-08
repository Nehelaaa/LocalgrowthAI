/**
 * Portfolio sites from ahmadnehela.com — fetched HTML becomes demo templates.
 * Run: node scripts/import-portfolio-templates.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

const OUT_DIR = path.join(__dirname, "..", "src", "lib", "demo-templates", "html");
const MANIFEST_PATH = path.join(__dirname, "..", "src", "lib", "demo-templates", "sources.json");

/** @type {import('../src/lib/demo-templates/types').TemplateSource[]} */
const SOURCES = [
  {
    id: "heights-barber",
    name: "Heights Barber",
    url: "https://heights-barbershop.vercel.app/",
    niches: ["barber", "barbershop", "grooming"],
    category: "barber",
    replace: {
      "Heights Barber Shop": "{{business_name}}",
      "Heights Barber": "{{business_name}}",
      "(781) 648-9686": "{{phone}}",
      "+1-781-648-9686": "{{phone_tel}}",
      "+17816489686": "{{phone_tel}}",
      "1317 Massachusetts Ave, Arlington, MA 02476": "{{address}}",
      "1317 Massachusetts Ave": "{{street}}",
      "Arlington, MA": "{{location}}",
      "Arlington": "{{city}}",
      "Classic cuts · Arlington, MA": "{{tagline_location}}",
      "4.9": "{{rating}}",
      "64": "{{review_count}}",
      "https://maps.google.com/maps?cid=15028273561629920310": "{{maps_url}}",
    },
  },
  {
    id: "maison-noir-barber",
    name: "Maison Noir Barber",
    url: "https://luxe-trim-co.vercel.app/",
    niches: ["barber", "barbershop", "grooming", "luxury"],
    category: "barber",
    replace: {
      "Maison Noir": "{{business_name}}",
      "Soho, London": "{{location}}",
      "Luxury Barbering Atelier": "{{category_label}}",
    },
  },
  {
    id: "rays-auto",
    name: "Ray's Auto",
    url: "https://rays-auto.vercel.app/",
    niches: ["auto", "repair", "mechanic", "garage", "automotive"],
    category: "auto_repair",
    replace: {
      "Ray's Auto": "{{business_name}}",
      "Ray&#x27;s Auto": "{{business_name}}",
      "RAY'S AUTO": "{{business_name}}",
      "RAY&#x27;S AUTO": "{{business_name}}",
      "Milford, MA": "{{location}}",
      "Auto Repair & Service": "{{category_label}}",
      "Auto Repair &amp; Service": "{{category_label}}",
    },
  },
  {
    id: "grub-kebab",
    name: "Grub Kebab",
    url: "https://kebabit.netlify.app/",
    niches: ["restaurant", "food", "cafe", "kitchen", "grill", "kebab"],
    category: "restaurant",
    replace: {
      "Grub Kebab": "{{business_name}}",
      "Authentic Middle Eastern Kitchen": "{{category_label}}",
    },
  },
  {
    id: "amora-salon",
    name: "Amora Leah Salon",
    url: "https://suave-salon-space.vercel.app/",
    niches: ["salon", "spa", "beauty", "hair", "bridal"],
    category: "salon",
    replace: {
      "Amora Leah Beauty Salon": "{{business_name}}",
      "Framingham, MA": "{{location}}",
      "Hair, Spa & Bridal": "{{category_label}}",
    },
  },
  {
    id: "paw-co",
    name: "Paw & Co",
    url: "https://petvibee.netlify.app/",
    niches: ["pet", "ecommerce", "retail", "shop"],
    category: "pet",
    replace: {
      "Paw &amp; Co.": "{{business_name}}",
      "Paw & Co.": "{{business_name}}",
      "Premium Pet Supplies": "{{category_label}}",
    },
  },
  {
    id: "expert-auto",
    name: "Expert Auto Shop",
    url: "https://expert-auto-boost.lovable.app/",
    niches: ["auto", "repair", "mechanic", "garage"],
    category: "auto_repair",
    replace: {
      "Expert Auto Shop": "{{business_name}}",
      "Expert Auto": "{{business_name}}",
    },
  },
  {
    id: "bills-auto",
    name: "Bill's Auto Services",
    url: "https://bill-waltham-revamp.lovable.app/",
    niches: ["auto", "repair", "mechanic", "garage"],
    category: "auto_repair",
    replace: {
      "Bill's Auto Services": "{{business_name}}",
      "Bill&#x27;s Auto Services": "{{business_name}}",
      "Waltham, MA": "{{location}}",
    },
  },
  {
    id: "nouve-bakery",
    name: "Nouve Bakery",
    url: "https://nouveau-sweet-lexington.lovable.app/",
    niches: ["bakery", "baker", "pastry"],
    category: "bakery",
    replace: {
      "Nouve Bakery": "{{business_name}}",
      "Nouve is a small neighborhood bakery": "{{business_name}} is a neighborhood bakery",
      "Inside the Nouve bakery": "Inside {{business_name}}",
      "A bakery built around": "A bakery built around",
      "Nouve began": "{{business_name}} began",
      "Nouve": "{{business_name_short}}",
      "Lexington, Massachusetts": "{{location}}",
      "Lexington · Massachusetts": "{{location}}",
      "Lexington, MA": "{{location}}",
      "Lexington": "{{city}}",
      "hello@nouvebakery.com": "{{phone_display}}",
      "(781) 555-0142": "{{phone}}",
      "1789 Massachusetts Avenue": "{{street}}",
      "Massachusetts Avenue": "{{street}}",
    },
  },
  {
    id: "mk-detailing",
    name: "MK Detailing",
    url: "https://mk-detailing.lovable.app/",
    niches: ["detailing", "car wash", "cleaning"],
    category: "detailing",
    replace: {
      "MK Detailing": "{{business_name}}",
    },
  },
  {
    id: "gleam-ride",
    name: "Kleins Auto Perfection",
    url: "https://gleam-ride-hub.vercel.app/",
    niches: ["detailing", "car wash"],
    category: "detailing",
    replace: {
      "Kleins Auto Perfection": "{{business_name}}",
      "Klein's Auto Perfection": "{{business_name}}",
    },
  },
  {
    id: "entoscapes",
    name: "Entoscapes",
    url: "https://entoscapes-dream-refresh.vercel.app/",
    niches: ["landscaping", "environmental", "garden", "lawn"],
    category: "landscaping",
    replace: {
      "Entoscapes": "{{business_name}}",
    },
  },
  {
    id: "crest-property",
    name: "Crest Property",
    url: "https://crest-property-showcase-q6kmxsatd.vercel.app/",
    niches: ["real estate", "property", "realtor", "homes"],
    category: "real_estate",
    replace: {
      "Crest Property": "{{business_name}}",
    },
  },
  {
    id: "zoumi-rental",
    name: "Zoumi Auto Rental",
    url: "https://www.zoumirentals.com/",
    niches: ["rental", "car rental"],
    category: "car_rental",
    replace: {
      "Zoumi Auto Rental": "{{business_name}}",
      "Zoumi": "{{business_name}}",
    },
  },
  {
    id: "elite-drive",
    name: "Cambridge Black Limo",
    url: "https://elite-drive-network.vercel.app/",
    niches: ["limo", "transport", "chauffeur", "travel"],
    category: "limo",
    replace: {
      "Cambridge Black Limo": "{{business_name}}",
      Cambridge: "{{city}}",
    },
  },
  {
    id: "mnandi-salon",
    name: "Mnandi Salon & Spa",
    url: "https://www.mnandisalonspa.com/",
    niches: ["salon", "spa", "beauty", "hair", "bridal"],
    category: "salon",
    replace: {
      "Mnandi Salon &amp; Spa": "{{business_name}}",
      "Mnandi Salon & Spa": "{{business_name}}",
      "Mnandi Salon": "{{business_name}}",
    },
  },
  {
    id: "franklin-tire",
    name: "Franklin Tire & Auto",
    url: "https://www.franklintireauto.com/",
    niches: ["auto", "repair", "mechanic", "tire"],
    category: "auto_repair",
    replace: {
      "Franklin Tire &amp; Auto": "{{business_name}}",
      "Franklin Tire & Auto": "{{business_name}}",
      "Franklin Tire": "{{business_name}}",
    },
  },
  {
    id: "westneuro",
    name: "WestNeuro",
    url: "https://westneuro.com/",
    niches: ["healthcare", "neurology", "medical", "clinic"],
    category: "healthcare",
    replace: {
      "WestNeuro": "{{business_name}}",
      "West Neuro": "{{business_name}}",
    },
  },
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rewriteAssetUrls(html, origin) {
  const base = origin.replace(/\/$/, "");
  return html
    .replace(/\shref="\/(?!\/)/g, ` href="${base}/`)
    .replace(/\ssrc="\/(?!\/)/g, ` src="${base}/`)
    .replace(/url\(\/(?!\/)/g, `url(${base}/`);
}

function applyReplacements(html, replaceMap) {
  const entries = Object.entries(replaceMap).sort((a, b) => b[0].length - a[0].length);
  let out = html;
  for (const [from, to] of entries) {
    out = out.split(from).join(to);
  }
  return out;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "LocalLeadster-Template-Import/1.0",
      Accept: "text/html",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = [];

  for (const source of SOURCES) {
    const outFile = path.join(OUT_DIR, `${source.id}.html`);
    try {
      console.log(`Fetching ${source.name}…`);
      const raw = await fetchHtml(source.url);
      const origin = new URL(source.url).origin;
      let html = rewriteAssetUrls(raw, origin);
      html = applyReplacements(html, source.replace);
      fs.writeFileSync(outFile, html, "utf8");
      manifest.push({
        id: source.id,
        name: source.name,
        sourceUrl: source.url,
        category: source.category ?? "local_business",
        niches: source.niches,
        file: `html/${source.id}.html`,
        bytes: Buffer.byteLength(html, "utf8"),
      });
      console.log(`  ✓ ${source.id} (${manifest.at(-1).bytes} bytes)`);
    } catch (e) {
      console.warn(`  ✗ ${source.id}: ${e.message}`);
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\nImported ${manifest.length} templates → ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
