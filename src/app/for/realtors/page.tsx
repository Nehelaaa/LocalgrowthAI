import type { Metadata } from "next";
import { PersonaPage } from "@/components/marketing/PersonaPage";

export const metadata: Metadata = {
  title: "LocalLeadster for Realtors — Local Partner Prospecting + Follow-ups",
  description:
    "Find local partners and service pros, then track relationship outreach and follow-ups in one simple pipeline. Start free.",
  alternates: { canonical: "/for/realtors" },
};

export default function RealtorsPage() {
  return <PersonaPage persona="realtors" />;
}

