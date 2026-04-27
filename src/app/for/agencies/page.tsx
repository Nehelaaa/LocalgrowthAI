import type { Metadata } from "next";
import { PersonaPage } from "@/components/marketing/PersonaPage";

export const metadata: Metadata = {
  title: "Agencies",
  description: "Standardize prospecting, run a clean CRM pipeline, and scale outreach to local businesses.",
};

export default function AgenciesPage() {
  return <PersonaPage persona="agencies" />;
}

