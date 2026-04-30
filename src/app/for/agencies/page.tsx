import type { Metadata } from "next";
import { PersonaPage } from "@/components/marketing/PersonaPage";

export const metadata: Metadata = {
  title: "LocalLeadster for Agencies — Prospecting + Pipeline for Local B2B",
  description:
    "Standardize local prospecting across the team: Google Places search, lead scoring, CRM stages, and exports on Pro. Start free.",
  alternates: { canonical: "/for/agencies" },
};

export default function AgenciesPage() {
  return <PersonaPage persona="agencies" />;
}

