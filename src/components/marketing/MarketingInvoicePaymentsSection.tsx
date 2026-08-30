import Link from "next/link";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";

const FLOW = [
  {
    n: "01",
    title: "Connect your Stripe",
    body: "Pro users link their Stripe account once. Payouts and refunds stay in their Stripe dashboard.",
  },
  {
    n: "02",
    title: "Build & text the invoice",
    body: "From any lead, open Invoice builder — then Share → Text link. Messages opens with a ready-to-send URL.",
  },
  {
    n: "03",
    title: "They pay on the link",
    body: "Clients open a clean invoice page and tap Pay. Checkout runs on your connected Stripe — funds go to you.",
  },
] as const;

/** Homepage section: SMS invoice share + Stripe Connect Pay now (Pro). */
export function MarketingInvoicePaymentsSection() {
  return (
    <section
      id="invoice-payments"
      className="scroll-mt-20 border-y border-slate-200/80 bg-gradient-to-b from-teal-50/40 via-white to-slate-50/60 py-14 dark:border-slate-800/80 dark:from-teal-950/20 dark:via-slate-950 dark:to-slate-900/40 sm:py-20"
      aria-labelledby="invoice-payments-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <MarketingReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
              New · Invoice payments
            </p>
            <h2
              id="invoice-payments-heading"
              className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl dark:text-white"
            >
              Text the invoice. Get paid on the same link.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Stop bouncing between your CRM, PDF tools, and a separate payment app. LocalLeadster
              lets you send a branded invoice by SMS — and on Pro, your client can pay by card
              through <strong className="font-semibold text-slate-800 dark:text-slate-200">your</strong>{" "}
              Stripe account.
            </p>
          </div>
        </MarketingReveal>

        <MarketingReveal className="mt-12">
          <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6" role="list">
            {FLOW.map((step) => (
              <li key={step.n} className="relative min-w-0">
                <p className="font-mono text-xs font-semibold tracking-wider text-teal-600/90 dark:text-teal-400/90">
                  {step.n}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </MarketingReveal>

        <MarketingReveal className="mt-12">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70">
            <div className="grid lg:grid-cols-2">
              <div className="border-b border-slate-100 p-6 sm:p-8 lg:border-b-0 lg:border-r dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  On every plan
                </p>
                <ul className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex gap-2">
                    <span className="mt-0.5 text-teal-600 dark:text-teal-400" aria-hidden>
                      ✓
                    </span>
                    <span>Branded invoice templates, logo, and PDF download from the CRM lead</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 text-teal-600 dark:text-teal-400" aria-hidden>
                      ✓
                    </span>
                    <span>Share a private view link — or open Messages with a prefilled text</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 text-teal-600 dark:text-teal-400" aria-hidden>
                      ✓
                    </span>
                    <span>Clients open a mobile-friendly invoice page (no LocalLeadster account)</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-teal-50/80 to-white p-6 sm:p-8 dark:from-teal-950/30 dark:to-slate-900/80">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-200">
                  Pro · Get paid
                </p>
                <ul className="mt-4 space-y-3 text-sm text-slate-800 dark:text-slate-200">
                  <li className="flex gap-2">
                    <span className="mt-0.5 text-teal-600 dark:text-teal-400" aria-hidden>
                      ✓
                    </span>
                    <span>Connect your personal Stripe — one-time Express onboarding</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 text-teal-600 dark:text-teal-400" aria-hidden>
                      ✓
                    </span>
                    <span>
                      <strong className="font-semibold">Pay now</strong> on the shared invoice —
                      Checkout on your connected account
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5 text-teal-600 dark:text-teal-400" aria-hidden>
                      ✓
                    </span>
                    <span>Paid status updates automatically when the charge succeeds</span>
                  </li>
                </ul>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Link
                    href="/register"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    Start free, upgrade for Pay now
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-teal-800 hover:underline dark:text-teal-200"
                  >
                    See Pro pricing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </MarketingReveal>
      </div>
    </section>
  );
}
