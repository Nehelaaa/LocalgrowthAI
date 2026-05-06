import type { Metadata } from "next";
import { PersonaPage } from "@/components/marketing/PersonaPage";
import { publicPageMetadata } from "@/lib/seo/public-page-metadata";

export const metadata: Metadata = publicPageMetadata({
  pathname: "/for/sales",
  title: "LocalLeadster for Sales Teams — Local Prospecting + CRM Workflow",
  description:
    "Build targeted local call lists, segment leads with simple signals, and keep outcomes + follow-ups organized in a clean pipeline. Start free.",
  keywords: [
    "sales team local prospecting",
    "BDR territory list building",
    "local call sheet software",
    "appointment setter local businesses",
  ],
});

export default function SalesPage() {
  return <PersonaPage persona="sales" />;
}

