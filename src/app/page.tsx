import type { Metadata } from "next";
import Link from "next/link";
import { FAQSection } from "@/components/marketing/FAQSection";
import { HeroHeadlines } from "@/components/marketing/HeroHeadlines";
import { HeroWorkflowStrip } from "@/components/marketing/HeroWorkflowStrip";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { MarketingMapsCompareSection } from "@/components/marketing/MarketingMapsCompareSection";
import { MarketingOpportunitySignalsSection } from "@/components/marketing/MarketingOpportunitySignalsSection";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { MarketingWorkflowReplacementSection } from "@/components/marketing/MarketingWorkflowReplacementSection";
import { OutreachProofSection } from "@/components/marketing/OutreachProofSection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { ProductMockup } from "@/components/marketing/ProductMockup";
import { SolutionsSection } from "@/components/marketing/SolutionsSection";
import { StatsStrip } from "@/components/marketing/StatsStrip";
import { marketingFaqs } from "@/lib/marketing/faq";
import { faqJsonLd, homeJsonLd, homeMetadata } from "@/lib/seo/jsonld";

export const metadata: Metadata = homeMetadata;

const FEATURE_CARDS = [
  {
    t: "Places-powered territory runs",
    d: "City, radius, and trade — a ranked local list without another night of Map tabs.",
    icon: "🗺️",
  },
  {
    t: "Signals & smart filters",
    d: "Stack rules and presets so qualification isn’t guesswork.",
    icon: "🎯",
  },
  {
    t: "Outreach-ready pipeline",
    d: "Pipeline stages, clear next actions, and follow-up dates on each lead — your call sheet stays current in one workspace.",
    icon: "📋",
  },
  {
    t: "Branded PDF invoices",
    d: "Generate client-ready invoices from the same row — no extra export step.",
    icon: "📄",
  },
  {
    t: "Account-scoped data",
    d: "Leads belong to your team’s login — built for serious client work.",
    icon: "🔐",
  },
  {
    t: "Close & revenue view",
    d: "Deal value and outcomes visible where you manage outreach — fewer surprises end of month.",
    icon: "💰",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(marketingFaqs)) }}
      />
      <MarketingShell>
        <section
          className="relative z-0 mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12 lg:grid-cols-2 lg:gap-12 lg:pt-16"
          aria-labelledby="hero-heading"
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Local prospecting & outreach workflows
            </p>
            <HeroHeadlines />
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
              Run repeatable territory searches, qualify with signals, then keep outreach organized — pipeline stages,
              follow-up tracking, and next actions — in{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">one LocalLeadster workspace</span>
              {" "}(including branded PDF invoices when it’s time to bill).
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/register"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-violet-500 hover:to-indigo-500"
              >
                Get started free
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-200/90 bg-white/80 px-6 py-3.5 text-base font-medium text-slate-800 transition hover:border-indigo-300 hover:bg-indigo-50/80 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:border-indigo-500/40"
              >
                How it works
              </a>
            </div>
            <p className="mt-6 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Built for freelancers, agencies, marketers, consultants, setters, sales teams, and realtors who sell to local
              businesses.
            </p>
          </div>
          <div className="relative flex justify-center lg:justify-end lgai-hero-fade" id="product-tour">
            <div
              className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-indigo-500/15 via-violet-500/10 to-transparent blur-2xl"
              aria-hidden
            />
            <ProductMockup />
          </div>
        </section>

        <MarketingReveal className="w-full">
          <HeroWorkflowStrip />
        </MarketingReveal>

        <section
          className="border-y border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-white py-10 dark:border-slate-800/80 dark:from-slate-950/80 dark:to-slate-900/40"
          aria-label="At a glance"
        >
          <MarketingReveal className="mx-auto max-w-5xl px-4 sm:px-6">
            <p className="mb-4 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
              Structure daily prospecting — from list to outreach — without juggling five tools.
            </p>
            <StatsStrip />
          </MarketingReveal>
        </section>

        <MarketingMapsCompareSection />

        <MarketingWorkflowReplacementSection />

        <MarketingOpportunitySignalsSection />

        <MarketingReveal>
          <HowItWorksSection />
        </MarketingReveal>

        <MarketingReveal>
          <SolutionsSection />
        </MarketingReveal>

        <MarketingReveal>
          <OutreachProofSection />
        </MarketingReveal>

        <section
          id="features"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-20"
          aria-labelledby="features-heading"
        >
          <MarketingReveal>
            <h2
              id="features-heading"
              className="text-center text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white"
            >
              Capability snapshot
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-600 dark:text-slate-400">
              The pieces that sit behind search, qualification, and outreach — spelled out once.
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
              {FEATURE_CARDS.map((f) => (
                <li
                  key={f.t}
                  className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/50"
                >
                  <span className="text-2xl" role="img" aria-hidden>
                    {f.icon}
                  </span>
                  <strong className="mt-2 text-slate-900 dark:text-white">{f.t}</strong>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.d}</p>
                </li>
              ))}
            </ul>
          </MarketingReveal>
        </section>

        <MarketingReveal>
          <PricingSection />
        </MarketingReveal>

        <MarketingReveal>
          <FAQSection />
        </MarketingReveal>
      </MarketingShell>
    </>
  );
}
