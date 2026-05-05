/**
 * Hosted Stripe Checkout can be themed per session via `checkoutBrandingSettings()`.
 *
 * ## Making it look clean (like polished SaaS billing pages)
 *
 * 1. **Never use the same hex for “Brand color” and “Accent”** in Stripe’s preview — you get one
 *    flat purple slab. Pick **one calm field** and **one strong CTA color**:
 *    - *Cursor-like (dark rail)*: Brand `#0f172a` or `#1e293b`, Accent `#7c3aed` or `#2563eb`.
 *    - *Light + airy*: Brand `#f1f5f9` or `#e2e8f0`, Accent `#2563eb` or `#7c3aed`.
 * 2. **Dashboard** → **Settings** → **Brand elements** → tab **Checkout & Payment Links** — set
 *    Icon (square) + Logo (wide) to **different** assets; only check **Prefer logo over icon** if
 *    the wide logo looks better than the square mark.
 * 3. **Customer portal** uses the same global branding area (not these env vars for layout):
 *    [Settings → Branding](https://dashboard.stripe.com/settings/branding). Stripe controls the
 *    exact layout (you can’t fully clone Cursor’s HTML), but logo, name, and a restrained palette
 *    still read as “designed.”
 *
 * **Test mode “Sandbox” twice:** Stripe often shows both (a) your business name with a
 *   **“sandbox”** suffix in the header and (b) the **Sandbox** pill. That pairing is controlled by
 *   Stripe for test checkouts — this app cannot remove it. **Live mode** checkouts drop the test
 *   treatment; use test mode only while integrating.
 *
 * Optional: [Billing → Customer portal](https://dashboard.stripe.com/settings/billing/portal)
 * for allowed actions; set `STRIPE_BILLING_PORTAL_CONFIGURATION_ID` when you use a custom config.
 *
 * Defaults: neutral checkout surface + indigo CTA so the purple pin mark stays the hero color.
 */
const DEFAULT_DISPLAY_NAME = "Localleadster";
/** Neutral slate (clean form / summary feel; avoids full-screen violet). */
const DEFAULT_CHECKOUT_BG = "#f1f5f9";
/** Indigo-600 — pay CTA; pairs with `public/logo.svg` gradient without duplicating icon purple. */
const DEFAULT_CHECKOUT_BUTTON = "#4f46e5";

/**
 * @param publicOrigin Your deployed app origin with no trailing slash (e.g. https://app.example.com).
 *        Used to build absolute URLs for `/icon.svg` and `/logo.svg` when brand images are enabled.
 */
export function checkoutBrandingSettings(publicOrigin: string) {
  const displayName =
    process.env.STRIPE_BRAND_DISPLAY_NAME?.trim() || DEFAULT_DISPLAY_NAME;
  const backgroundColor =
    process.env.STRIPE_CHECKOUT_BACKGROUND_COLOR?.trim() || DEFAULT_CHECKOUT_BG;
  const buttonColor =
    process.env.STRIPE_CHECKOUT_BUTTON_COLOR?.trim() || DEFAULT_CHECKOUT_BUTTON;

  const base = publicOrigin.replace(/\/$/, "");
  const useHostedImages = process.env.STRIPE_CHECKOUT_BRAND_IMAGES !== "0";

  const branding = {
    display_name: displayName,
    background_color: backgroundColor,
    button_color: buttonColor,
    border_style: "rounded" as const,
    font_family: "inter" as const,
    ...(useHostedImages
      ? {
          icon: {
            type: "url" as const,
            url:
              process.env.STRIPE_CHECKOUT_ICON_URL?.trim() || `${base}/icon.svg`,
          },
          logo: {
            type: "url" as const,
            url:
              process.env.STRIPE_CHECKOUT_LOGO_URL?.trim() || `${base}/logo.svg`,
          },
        }
      : {}),
  };

  return branding;
}

/** When set, passed to `billingPortal.sessions.create({ configuration })` (Dashboard → Customer portal). */
export function billingPortalConfigurationId(): string | undefined {
  const id = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID?.trim();
  return id || undefined;
}
