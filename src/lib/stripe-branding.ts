/**
 * Hosted Stripe Checkout can be themed per session via `checkoutBrandingSettings()`.
 *
 * **Customer Portal** (the “… partners with Stripe for simplified billing” page) is **not**
 * themeable from this codebase — Stripe renders it. Customize it here:
 * [Dashboard → Settings → Branding](https://dashboard.stripe.com/settings/branding)
 * — Icon (square), Logo (optional wider asset), Accent color, Brand color, and **Public business name**
 * (that name appears in the portal header next to the logo).
 *
 * The **Sandbox** badge and names like “Localgrowth sandbox” come from **test mode** and your
 * Stripe account / business profile settings, not from env vars.
 *
 * Optional: [Billing → Customer portal](https://dashboard.stripe.com/settings/billing/portal)
 * to define which actions customers can do; put the configuration id in
 * `STRIPE_BILLING_PORTAL_CONFIGURATION_ID`. See `stripeOperatorChecklist` in `billing-policies.ts`.
 *
 * Defaults below match the app’s violet/indigo palette (see `public/logo.svg` gradient).
 */
const DEFAULT_DISPLAY_NAME = "Localgrowth";
/** Light violet page background (similar to violet-50) */
const DEFAULT_CHECKOUT_BG = "#f5f3ff";
/** Violet-600 — primary actions */
const DEFAULT_CHECKOUT_BUTTON = "#7c3aed";

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
