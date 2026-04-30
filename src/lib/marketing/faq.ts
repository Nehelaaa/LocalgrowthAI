import { FREE_LEAD_LIMIT } from "@/lib/entitlements";

export const marketingFaqs: { q: string; a: string }[] = [
  {
    q: "Who is LocalGrowth AI for?",
    a: "Web agencies, freelancers, and small dev shops that sell sites to local businesses and need a repeatable way to find and work leads — not a generic B2B database.",
  },
  {
    q: "What’s included on the Free plan?",
    a: `You can search, use the CRM, and add up to ${FREE_LEAD_LIMIT} new leads over the life of the account (deleting a lead does not free a slot). AI generation, exports, and unlimited saves require Pro (via Stripe in the app).`,
  },
  {
    q: "Do I need a Google or OpenAI key?",
    a: "Google Places powers search; OpenAI powers optional AI text. Keys stay on your server in environment variables — never exposed in the browser.",
  },
  {
    q: "Is my data isolated from other customers?",
    a: "Yes. Leads and exports are scoped to your user account, with industry-standard session security.",
  },
  {
    q: "Can I cancel Pro anytime?",
    a: "Billing is handled through Stripe. You can open the customer portal from the dashboard to manage or cancel your subscription.",
  },
];
