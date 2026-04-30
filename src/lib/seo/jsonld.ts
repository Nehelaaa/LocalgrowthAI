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
          "Lead generation and pipeline for selling to local businesses: search, qualify, and close deals faster.",
      },
      {
        "@type": "SoftwareApplication",
        name: "LocalLeadster",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free tier with paid Pro subscription",
        },
        featureList: [
          "Google Places business search",
          "Signal-based lead scoring",
          "CRM pipeline and exports",
          "AI-powered outreach (Pro)",
        ],
      },
      {
        "@type": "Organization",
        name: "LocalLeadster",
        url: site,
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
    "Search Google Places, qualify leads with simple signals, run your CRM pipeline, and use AI outreach on Pro. Free to start — built for anyone selling to local businesses.",
  keywords: [
    "local business lead generation",
    "b2b prospecting tool",
    "local business lead generation",
    "crm pipeline",
    "Google Places B2B",
  ],
  openGraph: {
    title: "LocalLeadster — Find and close local deals",
    description:
      "End-to-end workflow: search, qualify, outreach, and close — from one clean workspace.",
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
