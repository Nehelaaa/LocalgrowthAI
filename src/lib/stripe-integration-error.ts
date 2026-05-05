import Stripe from "stripe";
import { safeErrorMessage } from "@/lib/api-security";

function duckStripeApiMessage(e: unknown): string | null {
  if (!e || typeof e !== "object") return null;
  const o = e as { message?: unknown; doc_url?: unknown };
  if (typeof o.message !== "string" || !o.message.trim()) return null;
  if (typeof o.doc_url === "string" && o.doc_url.includes("stripe.com/docs")) {
    return o.message.trim();
  }
  return null;
}

/**
 * Return a message safe to show in the browser when Stripe routes catch an error.
 * Stripe API errors are usually actionable (wrong price id, mode mismatch, etc.).
 */
export function stripeIntegrationPublicError(e: unknown): string {
  if (e instanceof Stripe.errors.StripeError) {
    return e.message;
  }
  return duckStripeApiMessage(e) ?? safeErrorMessage();
}
