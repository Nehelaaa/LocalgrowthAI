import { z } from "zod";
import { formatBusinessLocation } from "@/lib/format-business-location";
import type { DemoWebsiteInput } from "@/lib/demo-website/types";

export type DemoLayoutId =
  | "editorial"
  | "split"
  | "luxury"
  | "bento"
  | "dark"
  | "classic";

export type DemoWebsiteSpec = {
  layout: DemoLayoutId;
  fontPairId: number;
  colors: {
    primary: string;
    primaryDark: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  categoryLabel: string;
  tagline: string;
  headline?: string;
  about: string;
  services: { title: string; description: string }[];
  testimonials: { quote: string; source: string }[];
  ctaPrimary: string;
  ctaSecondary: string;
  sectionTitles: {
    services: string;
    about: string;
    reviews: string;
    contact: string;
  };
  galleryImages: string[];
};

export const FONT_PAIRS = [
  {
    display: "Fraunces",
    body: "DM Sans",
    url: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap",
  },
  {
    display: "Playfair Display",
    body: "Lato",
    url: "https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap",
  },
  {
    display: "Syne",
    body: "Inter",
    url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@500;600;700;800&display=swap",
  },
  {
    display: "Cormorant Garamond",
    body: "Outfit",
    url: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Outfit:wght@400;500;600;700&display=swap",
  },
  {
    display: "Libre Baskerville",
    body: "Plus Jakarta Sans",
    url: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
  },
  {
    display: "Bebas Neue",
    body: "Source Sans 3",
    url: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap",
  },
] as const;

const LAYOUTS: DemoLayoutId[] = ["editorial", "split", "luxury", "bento", "dark", "classic"];

const NICHE_IMAGES: Record<string, string[]> = {
  barber: [
    "https://images.unsplash.com/photo-1503956548150-087af205f3cc?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1585747865815-7f4b7b4e6e8f?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1600&q=80",
  ],
  auto: [
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1487754180451-cddd904a288e?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1600&q=80",
  ],
  food: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80",
  ],
  dental: [
    "https://images.unsplash.com/photo-1629909613654-28e377c37baf?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1606811841687-015d15482644?auto=format&fit=crop&w=1600&q=80",
  ],
  default: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1600&q=80",
  ],
};

const COLOR_PALETTES = [
  { primary: "#1c1917", primaryDark: "#0c0a09", accent: "#d97706", background: "#fafaf9", surface: "#ffffff", text: "#1c1917", muted: "#78716c" },
  { primary: "#0f172a", primaryDark: "#020617", accent: "#3b82f6", background: "#f8fafc", surface: "#ffffff", text: "#0f172a", muted: "#64748b" },
  { primary: "#14532d", primaryDark: "#052e16", accent: "#22c55e", background: "#f0fdf4", surface: "#ffffff", text: "#14532d", muted: "#4ade80" },
  { primary: "#4c0519", primaryDark: "#25050f", accent: "#f43f5e", background: "#fff1f2", surface: "#ffffff", text: "#881337", muted: "#fb7185" },
  { primary: "#312e81", primaryDark: "#1e1b4b", accent: "#818cf8", background: "#eef2ff", surface: "#ffffff", text: "#312e81", muted: "#6366f1" },
  { primary: "#134e4a", primaryDark: "#042f2e", accent: "#14b8a6", background: "#f0fdfa", surface: "#ffffff", text: "#134e4a", muted: "#2dd4bf" },
  { primary: "#431407", primaryDark: "#292524", accent: "#ea580c", background: "#fff7ed", surface: "#ffffff", text: "#431407", muted: "#fb923c" },
  { primary: "#18181b", primaryDark: "#09090b", accent: "#a855f7", background: "#18181b", surface: "#27272a", text: "#fafafa", muted: "#a1a1aa" },
];

const aiSpecSchema = z.object({
  layout: z.enum(["editorial", "split", "luxury", "bento", "dark", "classic"]),
  fontPairId: z.number().int().min(0).max(5),
  colors: z.object({
    primary: z.string(),
    primaryDark: z.string(),
    accent: z.string(),
    background: z.string(),
    surface: z.string(),
    text: z.string(),
    muted: z.string(),
  }),
  categoryLabel: z.string().min(2).max(40),
  tagline: z.string().min(10).max(160),
  headline: z.string().min(4).max(80).optional(),
  about: z.string().min(40).max(500),
  services: z
    .array(z.object({ title: z.string(), description: z.string() }))
    .min(3)
    .max(4),
  testimonials: z
    .array(z.object({ quote: z.string(), source: z.string() }))
    .min(2)
    .max(3),
  ctaPrimary: z.string().min(2).max(30),
  ctaSecondary: z.string().min(2).max(30),
  sectionTitles: z.object({
    services: z.string(),
    about: z.string(),
    reviews: z.string(),
    contact: z.string(),
  }),
});

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function nicheKey(type?: string | null): keyof typeof NICHE_IMAGES {
  const t = (type ?? "").toLowerCase();
  if (/barber|hair|salon|spa|beauty|nail/.test(t)) return "barber";
  if (/auto|repair|mechanic|garage|tire|body shop/.test(t)) return "auto";
  if (/baker|bakery|cafe|coffee|restaurant|food|pizza|grill/.test(t)) return "food";
  if (/dental|dentist|ortho/.test(t)) return "dental";
  return "default";
}

function pickGallery(seed: number, niche: keyof typeof NICHE_IMAGES, hero?: string | null): string[] {
  const pool = [...NICHE_IMAGES[niche]];
  if (hero?.trim()) pool.unshift(hero.trim());
  const out: string[] = [];
  for (let i = 0; i < 3; i++) {
    out.push(pool[(seed + i * 7) % pool.length]!);
  }
  return [...new Set(out)].slice(0, 3);
}

type NichePack = {
  labels: string[];
  taglines: string[];
  serviceSets: { title: string; description: string }[][];
  abouts: string[];
  testimonials: { quote: string; source: string }[][];
};

const NICHE_PACKS: Record<keyof typeof NICHE_IMAGES, NichePack> = {
  barber: {
    labels: ["Barbershop", "Men's grooming", "Hair studio", "Classic barber"],
    taglines: [
      "Sharp cuts. Clean fades. No appointment stress.",
      "Where every detail of your look gets the attention it deserves.",
      "Classic chair, modern skill — walk out looking your best.",
      "Your neighborhood spot for precision grooming and good conversation.",
    ],
    serviceSets: [
      [
        { title: "Skin fades & tapers", description: "Crisp lines and blends that hold up between visits." },
        { title: "Beard sculpting", description: "Shape, trim, and hot-towel finish for a polished look." },
        { title: "Kids & seniors", description: "Patient service for every age in the chair." },
      ],
      [
        { title: "Executive cut", description: "Professional styles for workdays and weekends alike." },
        { title: "Straight-razor shave", description: "Hot lather, careful technique, smooth results." },
        { title: "Walk-ins welcome", description: "Drop in when it fits your schedule." },
      ],
    ],
    abouts: [
      "We built this shop for people who care how they look — without the pretense. Every cut is deliberate, every client gets time in the chair.",
      "Local, independent, and obsessed with the details: neckline, blend, and finish. That's why regulars keep coming back.",
    ],
    testimonials: [
      [
        { quote: "Best fade in town. They listen, they're fast, and the shop always feels clean.", source: "Google review" },
        { quote: "My son won't go anywhere else. Friendly staff and consistent quality every time.", source: "Local customer" },
      ],
    ],
  },
  auto: {
    labels: ["Auto repair", "Mechanic shop", "Car care", "Automotive service"],
    taglines: [
      "Diagnostics you understand. Repairs you can trust.",
      "Honest estimates, quality parts, cars back on the road faster.",
      "Your local garage for maintenance, repairs, and peace of mind.",
      "We explain the work before we turn a wrench.",
    ],
    serviceSets: [
      [
        { title: "Check engine & diagnostics", description: "Clear answers before any repair is approved." },
        { title: "Brakes & suspension", description: "Safety-first work with quality components." },
        { title: "Oil, tires & maintenance", description: "Stay ahead of breakdowns with scheduled care." },
      ],
      [
        { title: "Engine & transmission", description: "Experienced techs for major mechanical work." },
        { title: "Electrical & AC", description: "Comfort and reliability restored the right way." },
        { title: "Fleet & commercial", description: "Keep your business vehicles on the road." },
      ],
    ],
    abouts: [
      "Drivers in the area trust us because we show the problem, quote the fix, and stand behind the work. No upsells — just straight talk.",
      "Family-owned and hands-on. We've seen every make and model, and we treat yours like it's going back to our own driveway.",
    ],
    testimonials: [
      [
        { quote: "Finally a shop that explains everything in plain English. Fair price and done when they said.", source: "Google review" },
        { quote: "Been coming here for years. Reliable, respectful, and they never push unnecessary work.", source: "Longtime customer" },
      ],
    ],
  },
  food: {
    labels: ["Restaurant", "Neighborhood kitchen", "Cafe & bakery", "Local eatery"],
    taglines: [
      "Made fresh daily — flavors worth coming back for.",
      "The spot locals recommend when friends visit from out of town.",
      "From first bite to last, everything is made with care.",
      "Comfort food elevated. Ingredients you can taste.",
    ],
    serviceSets: [
      [
        { title: "Dine in", description: "Warm atmosphere and plates served hot from our kitchen." },
        { title: "Takeout & pickup", description: "Order ahead and skip the wait." },
        { title: "Catering trays", description: "Feed the office, party, or family gathering." },
      ],
    ],
    abouts: [
      "We're proud to be part of the neighborhood — sourcing thoughtfully, cooking consistently, and welcoming everyone through the door.",
      "Our menu reflects what regulars ask for: generous portions, bold flavor, and the kind of service that feels personal.",
    ],
    testimonials: [
      [
        { quote: "Always fresh, always friendly. This is our go-to for date night and takeout.", source: "Google review" },
        { quote: "You can tell they care about the food. Portions are great and everything hits.", source: "Regular guest" },
      ],
    ],
  },
  dental: {
    labels: ["Dental practice", "Family dentist", "Dental care", "Smile studio"],
    taglines: [
      "Gentle care, modern tools, confident smiles.",
      "Comfort-first dentistry for the whole family.",
      "Prevention, restoration, and cosmetic care under one roof.",
      "Where patients actually relax in the chair.",
    ],
    serviceSets: [
      [
        { title: "Cleanings & exams", description: "Prevent problems early with thorough checkups." },
        { title: "Cosmetic whitening", description: "Brighter smiles with safe, proven treatments." },
        { title: "Restorative care", description: "Fillings, crowns, and repairs that look natural." },
      ],
    ],
    abouts: [
      "Our team combines clinical excellence with a calm, patient-first approach — so visits feel manageable, not stressful.",
      "We invest in modern imaging and techniques to make treatment efficient, comfortable, and easy to understand.",
    ],
    testimonials: [
      [
        { quote: "Kind staff, zero judgment, and they explain every step. Best dental experience I've had.", source: "Google review" },
        { quote: "Brought my kids here — they're actually not afraid to go anymore.", source: "Parent review" },
      ],
    ],
  },
  default: {
    labels: ["Local business", "Professional services", "Trusted local team", "Community favorite"],
    taglines: [
      "Quality work, clear communication, customers who refer their neighbors.",
      "Built on reputation — one satisfied client at a time.",
      "Professional service with the personal touch only a local team can offer.",
      "Reliable results when you need a name you can trust.",
    ],
    serviceSets: [
      [
        { title: "Core service", description: "The work we're known for — done right, on schedule." },
        { title: "Consultations", description: "Straight answers and a plan before anything starts." },
        { title: "Ongoing support", description: "We stay available after the job is done." },
      ],
    ],
    abouts: [
      "We're independent, locally rooted, and focused on doing right by the people who hire us. That's how we've grown — referrals, not gimmicks.",
      "Every project gets direct attention from people who care about the outcome, not a call center halfway across the country.",
    ],
    testimonials: [
      [
        { quote: "Responsive, professional, and fairly priced. Would hire again without hesitation.", source: "Google review" },
        { quote: "Showed up on time, did exactly what they promised, and cleaned up after. Rare find.", source: "Verified customer" },
      ],
    ],
  },
};

function createFallbackSpec(input: DemoWebsiteInput): DemoWebsiteSpec {
  const seed = hashString(
    `${input.name}|${input.businessType ?? ""}|${input.city ?? ""}|${input.address ?? ""}`
  );
  const niche = nicheKey(input.businessType);
  const pack = NICHE_PACKS[niche];
  const palette = COLOR_PALETTES[seed % COLOR_PALETTES.length]!;
  const layout = LAYOUTS[seed % LAYOUTS.length]!;
  const location = formatBusinessLocation({
    city: input.city,
    state: input.state,
    address: input.address,
  });

  const tagline = pack.taglines[seed % pack.taglines.length]!;
  const aboutBase = pack.abouts[seed % pack.abouts.length]!;
  const about =
    location !== "—"
      ? `${aboutBase} Proudly serving ${location} and surrounding neighborhoods.`
      : aboutBase;

  return {
    layout,
    fontPairId: seed % FONT_PAIRS.length,
    colors: layout === "dark" ? COLOR_PALETTES[7]! : palette,
    categoryLabel: pack.labels[seed % pack.labels.length]!,
    tagline,
    headline: undefined,
    about,
    services: pack.serviceSets[seed % pack.serviceSets.length]!,
    testimonials: pack.testimonials[seed % pack.testimonials.length]!,
    ctaPrimary: input.phone ? "Call now" : "Get in touch",
    ctaSecondary: "View services",
    sectionTitles: {
      services: ["What we do", "Our services", "How we help", "Expertise"][seed % 4]!,
      about: ["Our story", "About us", "Who we are", "The team"][seed % 4]!,
      reviews: ["Client love", "Reviews", "What people say", "Trusted locally"][seed % 4]!,
      contact: ["Visit us", "Book a visit", "Get started", "Contact"][seed % 4]!,
    },
    galleryImages: pickGallery(seed, niche, input.photoUrl),
  };
}

async function tryAiSpec(input: DemoWebsiteInput): Promise<DemoWebsiteSpec | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const location = formatBusinessLocation({
    city: input.city,
    state: input.state,
    address: input.address,
  });

  const seed = hashString(input.name);
  const fallbackLayout = LAYOUTS[seed % LAYOUTS.length];

  const prompt = `You are an elite web designer (Lovable / Base44 quality). Create a UNIQUE website content spec for this local business. Do NOT use generic filler — reference their name, category, and location naturally.

Business data:
- Name: ${input.name}
- Category: ${input.businessType ?? "local business"}
- Location: ${location}
- Address: ${input.address ?? "not listed"}
- Phone: ${input.phone ?? "not listed"}
- Google rating: ${input.rating ?? "unknown"} (${input.reviewCount ?? 0} reviews)

Return JSON only with this exact shape:
{
  "layout": "editorial" | "split" | "luxury" | "bento" | "dark" | "classic",
  "fontPairId": 0-5,
  "colors": { "primary", "primaryDark", "accent", "background", "surface", "text", "muted" } (hex colors tailored to this business vibe),
  "categoryLabel": short label,
  "tagline": compelling hero line specific to THIS business (not generic),
  "headline": optional alternate hero headline,
  "about": 2-3 sentences about THIS business in ${location},
  "services": [{ "title", "description" }] x3-4 real services for their trade,
  "testimonials": [{ "quote", "source" }] x2 realistic review snippets,
  "ctaPrimary": short button label,
  "ctaSecondary": short button label,
  "sectionTitles": { "services", "about", "reviews", "contact" } (creative, not generic)
}

Pick layout "${fallbackLayout}" unless another layout clearly fits the brand better. Colors must feel premium and distinct.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.85,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You output only valid JSON for premium local business landing pages. Every business must feel unique.",
          },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = aiSpecSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;

    const niche = nicheKey(input.businessType);
    return {
      ...parsed.data,
      galleryImages: pickGallery(seed, niche, input.photoUrl),
    };
  } catch {
    return null;
  }
}

export async function createDemoWebsiteSpec(input: DemoWebsiteInput): Promise<DemoWebsiteSpec> {
  const ai = await tryAiSpec(input);
  if (ai) return ai;
  return createFallbackSpec(input);
}
