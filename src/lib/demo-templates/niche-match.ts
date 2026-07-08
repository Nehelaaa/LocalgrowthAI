import type { DemoWebsiteInput } from "@/lib/demo-website/types";

/** Canonical niche used to pick a portfolio template pool. */
export type DemoNicheCategory =
  | "barber"
  | "salon"
  | "auto_repair"
  | "detailing"
  | "restaurant"
  | "bakery"
  | "pet"
  | "landscaping"
  | "real_estate"
  | "limo"
  | "car_rental"
  | "healthcare"
  | "local_business";

type Rule = {
  category: DemoNicheCategory;
  patterns: RegExp[];
};

/** Order matters — first match wins (most specific rules first). */
const RULES: Rule[] = [
  {
    category: "barber",
    patterns: [
      /\bbarber\b/i,
      /\bbarbershop\b/i,
      /\bbarber\s*shop\b/i,
      /\bmen'?s?\s+(hair|grooming|cut)/i,
      /\bfade(s)?\b/i,
      /\bhot\s+towel\s+shave/i,
    ],
  },
  {
    category: "salon",
    patterns: [
      /\bhair\s+salon\b/i,
      /\bbeauty\s+salon\b/i,
      /\bnail\s+salon\b/i,
      /\bsalon\b/i,
      /\bspa\b/i,
      /\bbridal\b/i,
      /\blash(es)?\b/i,
      /\bfacial(s)?\b/i,
      /\bmanicure\b/i,
      /\bpedicure\b/i,
      /\bbeauty\b/i,
      /\bcosmetology\b/i,
    ],
  },
  {
    category: "detailing",
    patterns: [
      /\bdetail(ing|er)?\b/i,
      /\bcar\s+wash\b/i,
      /\bauto\s+spa\b/i,
      /\bceramic\s+coat/i,
      /\bpaint\s+correction\b/i,
      /\bmobile\s+wash\b/i,
    ],
  },
  {
    category: "car_rental",
    patterns: [
      /\bcar\s+rental\b/i,
      /\bauto\s+rental\b/i,
      /\brent\s+a\s+car\b/i,
      /\bvehicle\s+rental\b/i,
      /\brental\s+car\b/i,
    ],
  },
  {
    category: "limo",
    patterns: [
      /\blimo(usine)?\b/i,
      /\bchauffeur\b/i,
      /\bblack\s+car\b/i,
      /\bairport\s+(transfer|shuttle)\b/i,
    ],
  },
  {
    category: "auto_repair",
    patterns: [
      /\bauto\s+repair\b/i,
      /\bautomotive\s+repair\b/i,
      /\bmechanic\b/i,
      /\bauto\s+shop\b/i,
      /\bauto\s+service(s)?\b/i,
      /\btire(s)?\b/i,
      /\bbrake(s)?\b/i,
      /\btransmission\b/i,
      /\boil\s+change\b/i,
      /\bbody\s+shop\b/i,
      /\bmuffler\b/i,
      /\bgarage\b/i,
    ],
  },
  {
    category: "bakery",
    patterns: [
      /\bbaker(y|ies)\b/i,
      /\bpastry\b/i,
      /\bcupcake\b/i,
      /\bdonut(s)?\b/i,
      /\bbread\s*(shop|bakery)?\b/i,
      /\bcakes?\s*&?\s*pastries\b/i,
    ],
  },
  {
    category: "restaurant",
    patterns: [
      /\brestaurant\b/i,
      /\bgrill\b/i,
      /\bkebab\b/i,
      /\bshawarma\b/i,
      /\bpizza\b/i,
      /\bdiner\b/i,
      /\bbistro\b/i,
      /\btaqueria\b/i,
      /\bsushi\b/i,
      /\bcatering\b/i,
      // cafe alone often means coffee shop; keep near bakery but after bakery rules
      /\bcafe\b/i,
      /\bcafé\b/i,
      /\bfood\b/i,
      /\bkitchen\b/i,
    ],
  },
  {
    category: "pet",
    patterns: [
      /\bpet\s+(store|shop|supply|supplies)\b/i,
      /\bdog\s+groom/i,
      /\bpet\b/i,
      /\bveterinar/i,
      /\banimal\b/i,
    ],
  },
  {
    category: "real_estate",
    patterns: [
      /\breal\s+estate\b/i,
      /\brealtor\b/i,
      /\bproperty\b/i,
      /\brealty\b/i,
      /\bhomes?\s+for\s+sale\b/i,
    ],
  },
  {
    category: "landscaping",
    patterns: [
      /\blandscap/i,
      /\blawn\b/i,
      /\bgarden(ing)?\b/i,
      /\btree\s+service\b/i,
      /\bhardscape\b/i,
      /\bnursery\b/i,
      /\bcontractor\b/i,
      /\broofer\b/i,
      /\bplumb(er|ing)\b/i,
      /\belectrician\b/i,
      /\bhvac\b/i,
    ],
  },
  {
    category: "healthcare",
    patterns: [
      /\bdental\b/i,
      /\bdentist\b/i,
      /\borthodont/i,
      /\bneuro(logy|logist)\b/i,
      /\bclinic\b/i,
      /\bmedical\b/i,
      /\bdoctor\b/i,
      /\bphysician\b/i,
      /\bhospital\b/i,
      /\bhealthcare\b/i,
      /\bchiropract/i,
    ],
  },
];

function haystack(input: DemoWebsiteInput): string {
  return [input.businessType, input.name].filter(Boolean).join(" ").toLowerCase();
}

export function resolveDemoNicheCategory(input: DemoWebsiteInput): DemoNicheCategory {
  const text = haystack(input);

  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(text))) {
      return rule.category;
    }
  }

  return "local_business";
}

export function nicheCategoryLabel(category: DemoNicheCategory): string {
  const labels: Record<DemoNicheCategory, string> = {
    barber: "Barbershop",
    salon: "Salon & spa",
    auto_repair: "Auto repair",
    detailing: "Auto detailing",
    restaurant: "Restaurant",
    bakery: "Bakery & cafe",
    pet: "Pet supplies",
    landscaping: "Landscaping & trades",
    real_estate: "Real estate",
    limo: "Limo & chauffeur",
    car_rental: "Car rental",
    healthcare: "Healthcare",
    local_business: "Local business",
  };
  return labels[category];
}
