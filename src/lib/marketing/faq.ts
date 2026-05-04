import { FREE_LEAD_LIMIT } from "@/lib/entitlements";

export const marketingFaqs: { q: string; a: string }[] = [
  {
    q: "Who is LocalLeadster for?",
    a: "Web agencies, freelancers, and small dev shops that sell sites to local businesses and need a repeatable way to find and work leads — not a generic B2B database.",
  },
  {
    q: "What’s included on the Free plan?",
    a: `You can search, use the CRM, and add up to ${FREE_LEAD_LIMIT} new leads over the life of the account (deleting a lead does not free a slot). Exports and unlimited saves require Pro (via Stripe in the app).`,
  },
  {
    q: "Do I need a Google key?",
    a: "Google Places powers search. Your API key stays on your server in environment variables — never exposed in the browser.",
  },
  {
    q: "Is my data isolated from other customers?",
    a: "Yes. Leads and exports are scoped to your user account, with industry-standard session security.",
  },
  {
    q: "Can I cancel Pro anytime?",
    a: "Billing is handled through Stripe. You can open the customer portal from the dashboard to manage or cancel your subscription.",
  },
  {
    q: "Can I generate invoices for clients?",
    a: "Yes. Pick a template, logo, and accent under Invoice templates, then open any lead and use Invoice builder to download a branded PDF (or copy plain text). Your layout stays saved in the browser for the next quote.",
  },
  {
    q: "What are search presets?",
    a: "Presets like Easy Wins, High Value, and Fast Closers apply a tuned bundle of filters in one click so you can narrow a territory fast — you can still tweak individual rules afterward.",
  },
];
