import Stripe from "stripe";
import { safeErrorMessage } from "@/lib/api-security";

/**
 * Return a message safe to show in the browser when Stripe routes catch an error.
 * Stripe API errors are usually actionable (wrong price id, mode mismatch, etc.).
 */
export function stripeIntegrationPublicError(e: unknown): string {
  if (e instanceof Stripe.errors.StripeError) {
    return e.message;
  }
  return safeErrorMessage();
}
