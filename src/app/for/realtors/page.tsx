import type { Metadata } from "next";
import { PersonaPage } from "@/components/marketing/PersonaPage";

export const metadata: Metadata = {
  title: "Realtors",
  description: "Find local partners and service pros, then track outreach and follow-ups in one pipeline.",
};

export default function RealtorsPage() {
  return <PersonaPage persona="realtors" />;
}

