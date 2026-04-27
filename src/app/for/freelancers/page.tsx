import type { Metadata } from "next";
import { PersonaPage } from "@/components/marketing/PersonaPage";

export const metadata: Metadata = {
  title: "Freelancers",
  description: "Find local prospects, qualify fast, and close more client projects with a simple pipeline.",
};

export default function FreelancersPage() {
  return <PersonaPage persona="freelancers" />;
}

