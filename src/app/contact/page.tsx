import type { Metadata } from "next";
import { ContactSupportPanel } from "@/components/marketing/ContactSupportPanel";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Contact support",
  description:
    "Reach the LocalLeadster team by email. Copy our support address or open your mail app.",
};

export default function ContactPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-lg px-4 py-14 sm:px-6 sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Contact support
        </h1>
        <div className="mt-8">
          <ContactSupportPanel />
        </div>
      </div>
    </MarketingShell>
  );
}
