/**
 * Managed Risk (Stripe-borne negative-balance liability) for Connect Express.
 * Docs: https://docs.stripe.com/connect/risk-management/managed-risk
 */

/**
 * Preview API version required for Express Dashboard + Stripe negative-balance liability.
 * Re-check the Managed Risk docs before shipping the live flag — preview strings can
 * change or graduate without much notice.
 * https://docs.stripe.com/connect/risk-management/managed-risk
 */
export const STRIPE_CONNECT_MANAGED_RISK_PREVIEW_API_VERSION =
  "2026-08-26.preview" as const;

/**
 * When true, new Connect accounts use Managed Risk (losses.payments = stripe).
 * Default OFF so production keeps classic Express (platform-liable) until sandbox
 * verification passes and an operator flips this deliberately.
 */
export function connectManagedRiskAccountsEnabled(): boolean {
  const raw = process.env.STRIPE_CONNECT_MANAGED_RISK_ACCOUNTS?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}
