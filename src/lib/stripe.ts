import Stripe from "stripe";

function requireSecret(): string {
  const k = process.env.STRIPE_SECRET_KEY?.trim();
  if (!k) {
    throw new Error("STRIPE_SECRET_KEY is not configured on the server.");
  }
  return k;
}

let _stripe: Stripe | null = null;

/** Pin API version so webhook + Checkout behavior stay aligned across deploys. */
const STRIPE_API_VERSION = "2026-03-25.dahlia";

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(requireSecret(), {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
    });
  }
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function proPriceId(): string {
  const p = process.env.STRIPE_PRICE_ID_PRO?.trim();
  if (!p) {
    throw new Error("STRIPE_PRICE_ID_PRO is not set.");
  }
  return p;
}
