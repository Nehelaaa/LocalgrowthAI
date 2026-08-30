/**
 * Single source of truth for billing behavior copy and operator guidance.
 * Product rules live in `entitlements.ts` and `api/stripe/webhook/route.ts`.
 */

/** Short blocks for the customer billing UI (plan page). */
export const customerBillingFaq = {
  cancelTitle: "Cancel or change your plan",
  cancelBody: [
    "After you subscribe, you manage your subscription in Stripe’s customer billing portal (opened from this app).",
    "There you can update your payment method, download invoices, change products or prices your administrator enabled, and cancel.",
    "If you cancel, Stripe usually keeps your access until the end of the period you already paid for—exact behavior is controlled in your Stripe Dashboard (cancel immediately vs end of period).",
    "When Stripe confirms the subscription has ended, your account moves to Starter limits automatically.",
  ],
  /** Shown above the charge-level payment table on the plan page. */
  paymentActivityIntro: [
    "Payments and refunds below come from Stripe charge data (same source as Dashboard → Payments).",
    "The hosted billing portal’s invoice list often still shows the original invoice as “Paid” after a refund, because the invoice was collected before the refund was applied—use this table or your receipt for refund status.",
  ],
} as const;

/** What the owner dashboard records and where to look. */
export const ownerVisibility = {
  alertsFeed: {
    path: "/owner/alerts",
    description:
      "Latest billing & risk events from webhooks: failed payments, successful renewals, refunds, disputes, cancellations, and “scheduled to cancel at period end”.",
  },
  churnPage: {
    path: "/owner/churn",
    description:
      "Cancellation history with Stripe metadata (reason/comment when Stripe sends them), plus scheduled end-of-period cancels.",
  },
  revenue: {
    path: "/owner/revenue",
    description: "High-level subscription revenue signals (tune with your Stripe reports for accounting).",
  },
} as const;

/** Recommended Stripe Dashboard settings (operator checklist). */
export const stripeOperatorChecklist = [
  "Customer portal: Settings → Customer portal — enable subscription cancellation, payment method update, and invoice history. Link products/prices you sell.",
  "Checkout: use subscription mode with STRIPE_PRICE_ID_PRO (recurring price).",
  "Webhooks: endpoint URL must match your deployed /api/stripe/webhook with the signing secret in STRIPE_WEBHOOK_SECRET.",
  "Subscribe the webhook to at least the events this app handles (see stripeWebhookEventsRecommended).",
  "Test mode: run a full flow (subscribe → portal → cancel at period end) and confirm /owner/alerts and /owner/churn update.",
  "Refunds: Dashboard → Payments shows refund state; the hosted customer portal invoice list may still show “Paid” on the original invoice. The app’s Plans & billing page lists charge-level status for signed-in customers.",
  "Hosted branding (Checkout + Customer portal landing): Stripe Dashboard → Settings → Branding — upload a square Icon (≥128px PNG/JPG) and set Accent color (page background tint) and Brand color (buttons) to match your app (defaults in code use violet #f5f3ff / #7c3aed). Set Public business name to “Localleadster”. Checkout also sends branding from this app (see `src/lib/stripe-branding.ts`); the portal’s “partners with Stripe” screen uses Dashboard branding, not our API.",
  "Logo file for Dashboard: run `node scripts/export-stripe-branding-pngs.mjs` in `localgrowth-app` to refresh `public/Localleadster-Stripe-logo.png` (horizontal) and `public/Localleadster-Stripe-logo-portal.png` (stacked, reads larger in the portal sidebar). Stripe allows one Logo upload—use portal if the header felt tiny, or horizontal if Checkout width matters more.",
  "Stripe invoice PDFs (Billing): the invoice template (e.g. Classic) is layout/type; **Brand color** under Settings → Branding still tints table headers and accent rules on the PDF—see Stripe docs “Customize invoices” / branding table. Match Brand color to the Classic neutrals (warm tan/brown) if you want it to look like the dashboard preview; Accent color does not apply to invoice PDFs.",
  "Connect (invoice Pay now): Stripe Dashboard → Connect → enable Express. Webhook endpoint must also listen to **Connected account** events: account.updated, account.application.deauthorized, checkout.session.completed, charge.refunded. Optional STRIPE_CONNECT_APPLICATION_FEE_BPS (e.g. 100 = 1%) and STRIPE_CONNECT_DEFAULT_COUNTRY (default US).",
  "Optional: create a Customer portal configuration (Billing → Customer portal) and set STRIPE_BILLING_PORTAL_CONFIGURATION_ID so portal sessions use it.",
] as const;

/** Events the webhook handler processes — keep Stripe webhook subscription in sync. */
export const stripeWebhookEventsRecommended = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.funds_withdrawn",
  "charge.dispute.closed",
  /** Connect: listen on Connected accounts (Stripe Dashboard → Webhooks → Connected accounts). */
  "account.updated",
  "account.application.deauthorized",
] as const;

/**
 * App policy per situation (for owner playbook UI).
 * "User state" is after webhook processing unless noted.
 */
export const billingSituations: Array<{
  situation: string;
  customerExperience: string;
  ownerWhereToLook: string;
  appBehavior: string;
}> = [
  {
    situation: "Customer completes Checkout (new subscription)",
    customerExperience: "Plan upgrades to Pro when Stripe confirms; success banner on return URL.",
    ownerWhereToLook: "/owner/alerts — “Checkout completed” / “Subscription payment succeeded”.",
    appBehavior: "User linked to Stripe customer; plan=pro while status is active/trialing/past_due.",
  },
  {
    situation: "Customer opens Customer Portal and cancels at period end",
    customerExperience: "Still Pro until period end; plan page can show “cancellation scheduled”.",
    ownerWhereToLook: "/owner/alerts — “Subscription set to cancel at period end”; /owner/churn scheduled table.",
    appBehavior: "User stays Pro until Stripe sends canceled/deleted; then plan=free.",
  },
  {
    situation: "Customer cancels immediately (if enabled in Stripe)",
    customerExperience: "Access may end right away per Stripe product settings.",
    ownerWhereToLook: "/owner/alerts + /owner/churn — subscription_canceled / deleted.",
    appBehavior: "Webhook sets plan=free and clears subscription fields when canceled/deleted.",
  },
  {
    situation: "Renewal payment fails",
    customerExperience: "Remains Pro during past_due grace (per entitlements); should update card in portal.",
    ownerWhereToLook: "/owner/alerts — payment_failed; /owner shows past_due users.",
    appBehavior: "subscriptionStatus=past_due keeps Pro until Stripe cancels or recovers.",
  },
  {
    situation: "Payment succeeds after failure",
    customerExperience: "Continues normally.",
    ownerWhereToLook: "/owner/alerts — payment_succeeded / renewed.",
    appBehavior: "subscription.updated + invoice.paid keep plan in sync.",
  },
  {
    situation: "Refund or dispute",
    customerExperience: "Handled in Stripe; access follows subscription state.",
    ownerWhereToLook: "/owner/alerts — refund or dispute severity.",
    appBehavior: "Events logged; subscription changes still come from subscription.* webhooks.",
  },
  {
    situation: "Pro customer connects Stripe Express for invoice payments",
    customerExperience: "Connects from Invoice payments; shared invoices show Pay when ready.",
    ownerWhereToLook: "/owner/alerts — Connect account updated / invoice share payment completed.",
    appBehavior:
      "stripeConnect* fields sync from account.updated; checkout.session.completed (mode=payment) marks InvoiceShare paid.",
  },
  {
    situation: "Legacy Pro (grandfathered, no Stripe sub)",
    customerExperience: "Full Pro without portal cancel; contact support for commercial changes.",
    ownerWhereToLook: "User record; no Stripe subscription events.",
    appBehavior: "grandfatheredPro bypasses paid gate; not tied to Stripe churn.",
  },
  {
    situation: "Customer never had Stripe customer id (free only)",
    customerExperience: "Upgrade via Checkout to create customer + subscription.",
    ownerWhereToLook: "N/A until they pay.",
    appBehavior: "Starter limits; portal unavailable until stripeCustomerId exists.",
  },
];
