import type { DemoNicheCategory } from "@/lib/demo-templates/niche-match";

/**
 * Portfolio templates grouped by niche.
 * Multiple templates per niche → rotated by business name hash for variety.
 */
export const TEMPLATES_BY_NICHE: Record<DemoNicheCategory, string[]> = {
  barber: ["heights-barber", "maison-noir-barber"],
  salon: ["amora-salon", "mnandi-salon"],
  auto_repair: ["rays-auto", "expert-auto", "bills-auto"],
  detailing: ["gleam-ride"],
  restaurant: ["grub-kebab"],
  /** Bakery only — never fall back to restaurant/kebab templates. */
  bakery: ["nouve-bakery"],
  pet: ["paw-co"],
  landscaping: ["entoscapes"],
  real_estate: ["crest-property"],
  limo: ["elite-drive"],
  car_rental: ["zoumi-rental"],
  /** Prefer medical template; salon only if westneuro missing. */
  healthcare: ["westneuro"],
  local_business: ["crest-property", "expert-auto"],
};

export function templatesForNiche(category: DemoNicheCategory): string[] {
  return TEMPLATES_BY_NICHE[category] ?? TEMPLATES_BY_NICHE.local_business;
}
