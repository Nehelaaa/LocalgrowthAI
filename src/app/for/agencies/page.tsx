import type { Metadata } from "next";
import { PersonaPage } from "@/components/marketing/PersonaPage";
import { publicPageMetadata } from "@/lib/seo/public-page-metadata";

export const metadata: Metadata = publicPageMetadata({
  pathname: "/for/agencies",
  title: "LocalLeadster for Agencies — Prospecting + Pipeline for Local B2B",
  description:
    "Standardize local prospecting across the team: Google Places search, lead scoring, CRM stages, and exports on Pro. Start free.",
  keywords: [
    "agency local lead generation",
    "SEO agency prospecting tool",
    "team CRM local businesses",
    "Google Places territory agency",
  ],
});

export default function AgenciesPage() {
  return <PersonaPage persona="agencies" />;
}

