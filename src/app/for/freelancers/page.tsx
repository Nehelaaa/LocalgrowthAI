import type { Metadata } from "next";
import { PersonaPage } from "@/components/marketing/PersonaPage";

export const metadata: Metadata = {
  title: "LocalLeadster for Freelancers — Local Lead Gen + CRM Pipeline",
  description:
    "LocalLeadster helps freelancers find local prospects with Google Places, qualify fast, and run follow-ups in a simple pipeline. Great for consultants, creatives, marketers, and local service providers.",
  alternates: { canonical: "/for/freelancers" },
};

export default function FreelancersPage() {
  return <PersonaPage persona="freelancers" />;
}

