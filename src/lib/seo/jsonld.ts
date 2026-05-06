import type { Metadata } from "next";

const site = process.env.AUTH_URL?.replace(/\/$/, "") || "https://localhost:3000";

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "LocalLeadster",
        url: site,
        description:
          "Lead generation and pipeline for selling to local businesses: search, qualify with presets, CRM with branded PDF invoices, and close deals faster.",
        potentialAction: {
          "@type": "SearchAction",
          target: `${site}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "LocalLeadster",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: site,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free tier with paid Pro subscription",
        },
        featureList: [
          "Google Places business search",
          "Refine results with presets and stackable filters",
          "Signal-based lead scoring",
          "CRM pipeline with active leads first",
          "Branded PDF invoice templates",
          "Unlimited lead saves (Pro)",
        ],
      },
      {
        "@type": "Organization",
        name: "LocalLeadster",
        url: site,
        logo: `${site}/logo.svg`,
      },
    ],
  } as const;
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.a,
      },
    })),
  };
}

export const homeMetadata: Metadata = {
  title: "LocalLeadster — Lead Gen + Pipeline for Local B2B",
  description:
    "Search Google Places, qualify with filters and presets, run your CRM, generate branded PDF invoices from any lead, and scale on Pro. Free to start.",
  keywords: [
    "local lead generation",
    "local business lead generation",
    "google places lead generation",
    "b2b prospecting tool",
    "local business prospecting",
    "crm pipeline",
    "sales pipeline software",
    "follow-up workflow",
    "invoice generator",
    "pdf invoice template",
    "agency lead generation",
    "freelancer lead generation",
  ],
  openGraph: {
    title: "LocalLeadster — Find and close local deals",
    description:
      "End-to-end workflow: search, qualify, manage follow-ups, and close — from one clean workspace.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "LocalLeadster — Lead gen + pipeline",
    description: "Search, qualify, and close local deals from one dashboard.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};
