import type { Metadata } from "next";
import Link from "next/link";
import { FAQSection } from "@/components/marketing/FAQSection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { OutreachProofSection } from "@/components/marketing/OutreachProofSection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { ProductMockup } from "@/components/marketing/ProductMockup";
import { SellingPointsSection } from "@/components/marketing/SellingPointsSection";
import { SolutionsSection } from "@/components/marketing/SolutionsSection";
import { StatsStrip } from "@/components/marketing/StatsStrip";
import { marketingFaqs } from "@/lib/marketing/faq";
import { faqJsonLd, homeJsonLd, homeMetadata } from "@/lib/seo/jsonld";

export const metadata: Metadata = homeMetadata;

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
                Local lead generation + CRM + branded invoices
              </p>
              <h1
                id="hero-heading"
                className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl lg:text-[2.75rem] lg:leading-[1.12]"
              >
                Find prospects, qualify fast, and close more local deals.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
                A Google Places lead generation tool that keeps outreach simple: search a territory, qualify with
                presets and stackable filters, run a CRM pipeline (active leads stay on top), send{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">branded PDF invoices</span> from any
                row, and close more deals with clear next steps — built for agencies, freelancers, and sales teams
                selling to local businesses.
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
              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                {["Freelancers", "Agencies", "Sales teams", "Realtors"].map((x) => (
                  <span
                    key={x}
                    className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 dark:border-slate-700/70 dark:bg-slate-900/30"
                  >
                    {x}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end lgai-hero-fade" id="product-tour">
              <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-indigo-500/15 via-violet-500/10 to-transparent blur-2xl" aria-hidden />
              <ProductMockup />
            </div>
          </section>

          <section
            className="border-y border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-white py-10 dark:border-slate-800/80 dark:from-slate-950/80 dark:to-slate-900/40"
            aria-label="Key metrics"
          >
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <StatsStrip />
            </div>
          </section>

          <HowItWorksSection />

          <SolutionsSection />

          <SellingPointsSection />

          <OutreachProofSection />

          <section
            id="features"
            className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-20"
            aria-labelledby="features-heading"
          >
            <h2
              id="features-heading"
              className="text-center text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white"
            >
              Everything in one product
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600 dark:text-slate-400">
              From search to close — organized so you can scale outreach without losing context.
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
              {[
                {
                  t: "Places-powered search",
                  d: 'Target city, state, radius, and trade. See who has no real site or "social only".',
                  icon: "🗺️",
                },
                {
                  t: "Filters & presets",
                  d: "Refine with tabs for basics, web signals, and fit — plus Easy Wins, High Value, and Fast Closers in one click.",
                  icon: "🎯",
                },
                {
                  t: "Scoring & pipeline",
                  d: "HOT / WARM / COLD, CRM stages, and a dashboard you can read in five seconds.",
                  icon: "📊",
                },
                {
                  t: "Branded PDF invoices",
                  d: "Multiple templates, logo upload, accent colors, and a live preview. Download from any lead without leaving the CRM.",
                  icon: "📄",
                },
                {
                  t: "Your data, your account",
                  d: "Leads are scoped to your login — ready for real client work, not a shared list.",
                  icon: "🔐",
                },
                {
                  t: "Close deals & track revenue",
                  d: "Deal value, close dates, outcomes, and a weekly view. Interested & contacted leads sort to the top of your list.",
                  icon: "💰",
                },
              ].map((f) => (
                <li
                  key={f.t}
                  className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/50"
                >
                  <span className="text-2xl" role="img" aria-hidden>
                    {f.icon}
                  </span>
                  <strong className="mt-2 text-slate-900 dark:text-white">{f.t}</strong>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {f.d}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <PricingSection />

          <FAQSection />
      </MarketingShell>
    </>
  );
}
