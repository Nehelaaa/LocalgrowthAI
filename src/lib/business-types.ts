/** Trades a user can prospect. Shared by the search form and onboarding territory step. */
export const BUSINESS_TYPES = [
  "auto repair",
  "restaurant",
  "dentist",
  "contractor",
  "plumber",
  "hair salon",
  "lawyer",
  "accountant",
  "gym",
  "real estate agent",
  "bakery",
  "pizza",
  "roofer",
  "electrician",
  "landscaping",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

/** Max length accepted for a free-typed business type (matches the search API schema). */
export const BUSINESS_TYPE_MAX_LENGTH = 80;

/** Trades that have a niche-matched demo-website template — used to tease the Pro generator. */
const TEMPLATE_BACKED = new Set<string>([
  "hair salon",
  "auto repair",
  "bakery",
  "contractor",
  "roofer",
  "electrician",
  "plumber",
  "landscaping",
]);

export function hasDemoTemplateForType(businessType: string): boolean {
  return TEMPLATE_BACKED.has(businessType.trim().toLowerCase());
}
