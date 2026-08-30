import { FREE_LEAD_LIMIT } from "@/lib/entitlements";

export const marketingFaqs: { q: string; a: string }[] = [
  {
    q: "Who is LocalLeadster for?",
    a: "Web agencies, freelancers, and small teams that sell to local businesses and need a repeatable way to find, work, invoice, and collect payment — not a generic B2B database.",
  },
  {
    q: "What’s included on the Free plan?",
    a: `You can search, use the CRM, build branded invoices, and share a view link or text it via SMS. You can add up to ${FREE_LEAD_LIMIT} new leads over the life of the account (deleting a lead does not free a slot). Unlimited saves and card payments on invoices require Pro.`,
  },
  {
    q: "Can I text an invoice to a client?",
    a: "Yes. From Invoice builder, open Share → Text link. LocalLeadster creates a private invoice page and opens your phone’s Messages app with the link ready to send. Clients don’t need a LocalLeadster account to view it.",
  },
  {
    q: "Can my clients pay the invoice online?",
    a: "On Pro, connect your own Stripe account under Invoice payments. When you share an invoice, eligible totals show Pay now on the public page. Checkout runs on your connected Stripe — funds go to you, not LocalLeadster.",
  },
  {
    q: "Can I cancel Pro anytime?",
    a: "Billing is handled through Stripe. You can open the customer portal from the dashboard to manage or cancel your LocalLeadster subscription. Connected Stripe payouts for client invoices are managed in your own Stripe Express dashboard.",
  },
  {
    q: "Can I generate PDF invoices too?",
    a: "Yes. Pick a template, logo, and accent under Invoice templates, then open any lead and use Invoice builder to download a branded PDF (or copy plain text). Layout syncs to your account so desktop and mobile stay aligned.",
  },
  {
    q: "What are search presets?",
    a: "Presets like Easy Wins, High Value, and Fast Closers apply a tuned bundle of filters in one click so you can narrow a territory fast — you can still tweak individual rules afterward.",
  },
];
