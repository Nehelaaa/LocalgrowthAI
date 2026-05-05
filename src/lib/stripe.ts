import Stripe from "stripe";

/** Prefer `STRIPE_SECRET_KEY`; `STRIPE_SECRET_KEY_LIVE` is supported for hosts that use that name (e.g. Vercel). */
export function stripeSecretKeyResolved(): string | undefined {
  return (
    process.env.STRIPE_SECRET_KEY?.trim() ||
    process.env.STRIPE_SECRET_KEY_LIVE?.trim()
  );
}

function requireSecret(): string {
  const k = stripeSecretKeyResolved();
  if (!k) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured on the server. Set STRIPE_SECRET_KEY (or alias STRIPE_SECRET_KEY_LIVE)."
    );
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
  return Boolean(stripeSecretKeyResolved());
}

/** Prefer `STRIPE_PRICE_ID_PRO`; `STRIPE_PRICE_ID_PRO_LIVE` is a supported alias. */
export function stripeProPriceIdResolved(): string | undefined {
  const raw =
    process.env.STRIPE_PRICE_ID_PRO?.trim() ||
    process.env.STRIPE_PRICE_ID_PRO_LIVE?.trim();
  if (!raw) return undefined;
  // Product ids are a common mis-copy from Stripe Dashboard.
  if (raw.startsWith("prod_")) return undefined;
  return raw;
}

/**
 * If set, return a user-facing misconfiguration message (e.g. prod_ pasted instead of price_).
 */
export function stripePriceProConfigurationError(): string | null {
  const raw =
    process.env.STRIPE_PRICE_ID_PRO?.trim() ||
    process.env.STRIPE_PRICE_ID_PRO_LIVE?.trim();
  if (!raw) return null;
  if (raw.startsWith("prod_")) {
    return "STRIPE_PRICE_ID_PRO (or STRIPE_PRICE_ID_PRO_LIVE) is a Product id (prod_…). Checkout needs the recurring Price id (price_…): Stripe Dashboard → Products → your product → Pricing → copy the Price id (starts with price_).";
  }
  return null;
}

export function proPriceId(): string {
  const p = stripeProPriceIdResolved();
  if (!p) {
    throw new Error(
      "STRIPE_PRICE_ID_PRO is not set. Set STRIPE_PRICE_ID_PRO (or alias STRIPE_PRICE_ID_PRO_LIVE)."
    );
  }
  return p;
}

/** Prefer `STRIPE_WEBHOOK_SECRET`; `STRIPE_WEBHOOK_SECRET_LIVE` is a supported alias. */
export function stripeWebhookSecretResolved(): string | undefined {
  return (
    process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
    process.env.STRIPE_WEBHOOK_SECRET_LIVE?.trim()
  );
}
