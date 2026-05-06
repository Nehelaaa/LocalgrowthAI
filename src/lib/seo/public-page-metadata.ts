import type { Metadata } from "next";

const defaultOgImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "LocalLeadster — local B2B prospecting, CRM pipeline, and invoicing",
} as const;

/**
 * Consistent SEO defaults for indexable marketing and conversion pages.
 */
export function publicPageMetadata(opts: {
  pathname: `/${string}`;
  title: string;
  description: string;
  /** Shorter social title when browser title is long */
  ogTitle?: string;
  keywords?: string[];
}): Metadata {
  const ogTitle = opts.ogTitle ?? opts.title;
  return {
    title: opts.title,
    description: opts.description,
    ...(opts.keywords?.length ? { keywords: opts.keywords } : {}),
    alternates: { canonical: opts.pathname },
    openGraph: {
      title: ogTitle,
      description: opts.description,
      type: "website",
      url: opts.pathname,
      siteName: "LocalLeadster",
      locale: "en_US",
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: opts.description,
      images: [defaultOgImage.url],
    },
    robots: { index: true, follow: true },
  };
}
