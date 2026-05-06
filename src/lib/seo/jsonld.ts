import type { Metadata } from "next";
import { getMetadataBase, getSiteOrigin } from "@/lib/seo/site";

const site = getSiteOrigin();

const brandLogo = `${site}/logo.svg`;
/** Branded OG route (absolute URL for JSON-LD). */
const pageHeroImage = `${site}/opengraph-image`;

const organizationId = `${site}/#organization`;
const websiteId = `${site}/#website`;

export function homeJsonLd() {
  const webpageId = `${site}/#webpage`;
  const softwareId = `${site}/#software`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: "LocalLeadster",
        url: site,
        description:
          "Local lead generation software for freelancers, agencies, marketers, consultants, appointment setters, sales teams, and realtors. Automate Google Places territory prospecting, qualify with signals, run a CRM pipeline, and send branded PDF invoices from one workspace.",
        publisher: { "@id": organizationId },
        inLanguage: "en-US",
      },
      {
        "@type": "WebPage",
        "@id": webpageId,
        url: `${site}/`,
        name: "LocalLeadster — Local B2B lead generation & pipeline",
        description:
          "Find high-intent local businesses in minutes. Automate territory search, reduce manual Google Maps work, organize outreach, and close more deals with CRM + branded invoices.",
        isPartOf: { "@id": websiteId },
        about: { "@id": softwareId },
        primaryImageOfPage: { "@type": "ImageObject", url: pageHeroImage },
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        "@id": softwareId,
        name: "LocalLeadster",
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Lead generation software",
        operatingSystem: "Web",
        url: site,
        description:
          "Local prospecting plus outreach workflows: Google Places territory search, opportunity signals, HOT/WARM/COLD scoring, pipeline stages with next actions and follow-up tracking, organized call-sheet style lists, and branded PDF invoices — one workspace instead of disconnected tools.",
        screenshot: pageHeroImage,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free tier with optional Pro subscription for advanced limits and billing",
          url: `${site}/register`,
        },
        featureList: [
          "Google Places territory business search",
          "Stackable filters and one-click qualification presets",
          "Opportunity signals: no website, low reviews, weak SEO, social-only, weak online presence, stale or outdated sites",
          "Lead scoring with HOT WARM COLD tiers",
          "CRM pipeline with stages, next actions, follow-up tracking, and notes",
          "Branded PDF invoice generation from lead records",
          "Deal value and revenue tracking for local B2B sales",
        ],
      },
      {
        "@type": "ItemList",
        name: "LocalLeadster core capabilities",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Automated local territory prospecting" },
          { "@type": "ListItem", position: 2, name: "Faster qualification vs manual Google Maps research" },
          { "@type": "ListItem", position: 3, name: "CRM and outreach organization in one dashboard" },
          { "@type": "ListItem", position: 4, name: "Branded PDF invoicing without a separate tool" },
        ],
      },
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "LocalLeadster",
        url: site,
        logo: { "@type": "ImageObject", url: brandLogo },
        description:
          "LocalLeadster builds web software for local B2B prospecting — lead generation, pipeline management, and invoicing for agencies, freelancers, and sales teams.",
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

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const homeMetadata: Metadata = {
  metadataBase: getMetadataBase(),
  applicationName: "LocalLeadster",
  title: {
    default: "LocalLeadster — Local Lead Generation Software | CRM + Invoices",
    template: "%s | LocalLeadster",
  },
  description:
    "Find high-intent local businesses in minutes. Automate Google Places territory prospecting, qualify with opportunity signals, organize outreach in a CRM, and send branded PDF invoices — for freelancers, web designers, SEO agencies, marketers, consultants, appointment setters, sales teams, and realtors.",
  authors: [{ name: "LocalLeadster", url: site }],
  creator: "LocalLeadster",
  publisher: "LocalLeadster",
  keywords: [
    "local lead generation software",
    "local business lead generation",
    "google places prospecting",
    "google maps sales prospecting alternative",
    "territory lead search",
    "b2b local prospecting tool",
    "crm for freelancers",
    "agency lead generation",
    "seo agency prospecting",
    "appointment setter tools",
    "realtor b2b partnerships",
    "branded pdf invoice generator",
    "local sales pipeline",
    "reduce manual prospecting",
  ],
  openGraph: {
    title: "LocalLeadster — Automate local prospecting. Close more deals.",
    description:
      "Stop wasting hours on Google Maps and spreadsheets. Prospect, qualify, manage, and invoice local leads from one workspace.",
    type: "website",
    url: "/",
    siteName: "LocalLeadster",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "LocalLeadster — local B2B prospecting, CRM pipeline, and invoicing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LocalLeadster — Local lead gen without the busywork",
    description:
      "Territory search, signals, CRM, and invoices — one workflow for agencies, freelancers, and sales teams.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  category: "technology",
  ...(googleSiteVerification
    ? { verification: { google: googleSiteVerification } }
    : {}),
};
