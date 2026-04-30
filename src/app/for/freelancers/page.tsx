import type { Metadata } from "next";
import { PersonaPage } from "@/components/marketing/PersonaPage";

export const metadata: Metadata = {
  title: "LocalLeadster for Freelancers — Local Lead Gen + CRM Pipeline",
  description:
    "LocalLeadster helps freelance web developers find local prospects with Google Places, qualify fast, and run follow-ups in a simple CRM pipeline. Start free.",
  alternates: { canonical: "/for/freelancers" },
};

export default function FreelancersPage() {
  return <PersonaPage persona="freelancers" />;
}

