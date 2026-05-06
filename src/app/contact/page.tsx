import type { Metadata } from "next";
import { PublicContactForm } from "@/components/marketing/PublicContactForm";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { publicPageMetadata } from "@/lib/seo/public-page-metadata";

export const metadata: Metadata = publicPageMetadata({
  pathname: "/contact",
  title: "Contact LocalLeadster support",
  ogTitle: "Contact LocalLeadster",
  description:
    "Questions about billing, Google Places search limits, exports, or your account? Send a message to the LocalLeadster team and we will get back to you.",
  keywords: ["LocalLeadster support", "LocalLeadster contact", "local lead software help"],
});

export default function ContactPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-lg px-4 py-14 sm:px-6 sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Contact support
        </h1>
        <div className="mt-8">
          <PublicContactForm />
        </div>
      </div>
    </MarketingShell>
  );
}
