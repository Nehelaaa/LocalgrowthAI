import type { Metadata } from "next";
import { PersonaPage } from "@/components/marketing/PersonaPage";
import { publicPageMetadata } from "@/lib/seo/public-page-metadata";

export const metadata: Metadata = publicPageMetadata({
  pathname: "/for/realtors",
  title: "LocalLeadster for Realtors — Local Partner Prospecting + Follow-ups",
  description:
    "Find local partners and service pros, then track relationship outreach and follow-ups in one simple pipeline. Start free.",
  keywords: [
    "realtor local partner prospecting",
    "real estate vendor outreach CRM",
    "local business relationships realtor",
  ],
});

export default function RealtorsPage() {
  return <PersonaPage persona="realtors" />;
}

