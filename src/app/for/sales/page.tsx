import type { Metadata } from "next";
import { PersonaPage } from "@/components/marketing/PersonaPage";

export const metadata: Metadata = {
  title: "Sales teams",
  description: "Build targeted local call lists, segment by signals, and keep follow-ups organized.",
};

export default function SalesPage() {
  return <PersonaPage persona="sales" />;
}

