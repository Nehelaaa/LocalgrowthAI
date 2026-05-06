import type { Metadata } from "next";
import { PersonaPage } from "@/components/marketing/PersonaPage";
import { publicPageMetadata } from "@/lib/seo/public-page-metadata";

export const metadata: Metadata = publicPageMetadata({
  pathname: "/for/freelancers",
  title: "LocalLeadster for Freelancers — Local Lead Gen + CRM Pipeline",
  description:
    "LocalLeadster helps freelancers find local prospects with Google Places, qualify fast, and run follow-ups in a simple pipeline. Great for consultants, creatives, marketers, and local service providers.",
  keywords: [
    "freelancer local leads",
    "Google Places prospecting freelancer",
    "small business CRM freelancer",
    "local B2B pipeline solo",
  ],
});

export default function FreelancersPage() {
  return <PersonaPage persona="freelancers" />;
}

