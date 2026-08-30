import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PricingSection } from "@/components/marketing/PricingSection";
import { publicPageMetadata } from "@/lib/seo/public-page-metadata";

export const metadata: Metadata = publicPageMetadata({
  pathname: "/pricing",
  title: "Pricing — LocalLeadster",
  ogTitle: "LocalLeadster pricing",
  description:
    "Start free with lifetime lead and search limits. Upgrade to Pro for unlimited leads, higher search caps, demo websites, unlimited invoice PDFs, and Stripe Connect so clients can Pay now on shared invoices.",
  keywords: [
    "LocalLeadster pricing",
    "local lead generation pricing",
    "LocalLeadster Pro",
    "invoice payments Stripe",
  ],
});

export default function PricingPage() {
  return (
    <MarketingShell>
      <div className="pt-4 sm:pt-8">
        <PricingSection />
      </div>
    </MarketingShell>
  );
}
