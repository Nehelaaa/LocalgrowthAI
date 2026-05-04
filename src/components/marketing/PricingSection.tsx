import Link from "next/link";
import { FREE_LEAD_LIMIT } from "@/lib/entitlements";

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75 9 17.25 19.5 6.75" />
    </svg>
  );
}

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 bg-gradient-to-b from-slate-100/90 via-white to-slate-50/80 py-20 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950 sm:py-24"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <h2
            id="pricing-heading"
            className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white"
          >
            Simple, honest pricing
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-400">
            Start free. Upgrade in the app when you want exports and unlimited leads — billed securely through
            Stripe.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-10">
          {/* Free */}
          <div className="relative flex flex-col rounded-3xl border border-slate-200/90 bg-white/95 p-8 shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700/80 dark:bg-slate-900/70 dark:ring-white/5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Free</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try the full workflow</p>
            </div>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">$0</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">forever</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <strong className="font-semibold text-slate-900 dark:text-white">{FREE_LEAD_LIMIT} leads for life</strong>
              {" "}on your account. Each new business you add to the CRM uses one slot. Deleting a lead does{" "}
              <em>not</em> bring a slot back — upgrade to Pro for unlimited saves.
            </p>
            <ul className="mt-8 flex-1 space-y-3.5 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex gap-3">
                <CheckIcon />
                <span>Map search, pipeline, and CRM basics</span>
              </li>
              <li className="flex gap-3">
                <CheckIcon />
                <span>Lead scoring &amp; contact tracking</span>
              </li>
              <li className="flex gap-3">
                <CheckIcon />
                <span>Branded invoice PDFs — templates, logo, and colors from the CRM</span>
              </li>
              <li className="flex gap-3">
                <CheckIcon />
                <span>Upgrade in-app when you need more</span>
              </li>
            </ul>
            <Link
              href="/register"
              className="mt-8 block text-center rounded-2xl border-2 border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-900 transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:border-indigo-500/50 dark:hover:bg-indigo-950/40"
            >
              Start for free
            </Link>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-indigo-500/35 bg-gradient-to-br from-indigo-50/95 via-white to-violet-50/50 p-8 shadow-lg shadow-indigo-500/10 dark:border-indigo-400/30 dark:from-indigo-950/50 dark:via-slate-900/90 dark:to-violet-950/30 dark:shadow-indigo-900/20">
            <div className="absolute right-5 top-5">
              <span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm dark:bg-indigo-500">
                Pro
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pro</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">For active prospecting</p>
            </div>
            <p className="mt-6 flex flex-wrap items-baseline gap-1.5">
              <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">$15</span>
              <span className="text-lg font-semibold text-slate-600 dark:text-slate-400">/ month</span>
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Charged in Stripe — cancel or manage anytime in the app.
            </p>
            <ul className="mt-8 flex-1 space-y-3.5 text-sm text-slate-800 dark:text-slate-200">
              <li className="flex gap-3">
                <CheckIcon />
                <span>
                  <strong className="text-slate-900 dark:text-white">Unlimited</strong> lead saves
                </span>
              </li>
              <li className="flex gap-3">
                <CheckIcon />
                <span>Everything in Free, including invoice builder &amp; search presets</span>
              </li>
              <li className="flex gap-3">
                <CheckIcon />
                <span>Exports: CSV + JSON endpoints</span>
              </li>
              <li className="flex gap-3">
                <CheckIcon />
                <span>Automation-friendly (Sheets, Airtable, Zapier/Make)</span>
              </li>
              <li className="flex gap-3">
                <CheckIcon />
                <span>Higher daily search quota + customer billing portal</span>
              </li>
            </ul>
            <Link
              href="/register"
              className="mt-8 block text-center rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md transition hover:from-violet-500 hover:to-indigo-500 dark:shadow-indigo-500/20"
            >
              Create account — upgrade in the app
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
