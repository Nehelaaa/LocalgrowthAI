import Stripe from "stripe";

function requireSecret(): string {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k) {
    throw new Error("STRIPE_SECRET_KEY is not configured on the server.");
  }
  return k;
}

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(requireSecret());
  }
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function proPriceId(): string {
  const p = process.env.STRIPE_PRICE_ID_PRO;
  if (!p) {
    throw new Error("STRIPE_PRICE_ID_PRO is not set.");
  }
  return p;
}
