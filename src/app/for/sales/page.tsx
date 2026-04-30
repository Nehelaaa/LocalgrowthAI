import type { Metadata } from "next";
import { PersonaPage } from "@/components/marketing/PersonaPage";

export const metadata: Metadata = {
  title: "LocalLeadster for Sales Teams — Local Prospecting + CRM Workflow",
  description:
    "Build targeted local call lists, segment leads with simple signals, and keep outcomes + follow-ups organized in a clean pipeline. Start free.",
  alternates: { canonical: "/for/sales" },
};

export default function SalesPage() {
  return <PersonaPage persona="sales" />;
}

