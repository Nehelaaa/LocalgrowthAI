import Link from "next/link";
import { MarketingReveal } from "./MarketingReveal";

/**
 * Explains the Pro demo-website generator (src/actions/demo.ts).
 * TODO: Replace DemoWebsitePlaceholder with a real product screenshot or short GIF
 * once we have a capture of Generate website → shareable /demo/[slug] page.
 */
export function MarketingDemoWebsiteSection() {
  return (
    <section
      id="demo-websites"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6 sm:py-14"
      aria-labelledby="demo-websites-heading"
    >
      <MarketingReveal>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              Demo websites · Pro
            </p>
            <h2
              id="demo-websites-heading"
              className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white"
            >
              Generate a live site mockup from any saved lead
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
              One click from the lead panel builds a niche-matched demo page using their
              Google business details — name, location, phone, reviews — and publishes a
              real shareable URL you can open in the browser or send in a pitch.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {[
                "Works from a saved CRM lead — no separate design tool",
                "Templates match the niche (salon, auto, bakery, and more)",
                "Share the live demo link so they see what a better site looks like",
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-0.5 text-emerald-600" aria-hidden>
                    ✓
                  </span>
                  {line}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-7 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-violet-500 hover:to-indigo-500"
            >
              Start free — no card required
            </Link>
          </div>
          <DemoWebsitePlaceholder />
        </div>
      </MarketingReveal>
    </section>
  );
}

function DemoWebsitePlaceholder() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-dashed border-indigo-300/80 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/80 p-6 shadow-sm dark:border-indigo-500/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/30"
      role="img"
      aria-label="Placeholder for demo website product screenshot"
    >
      {/* TODO: Replace this placeholder with a real screenshot/GIF of Generate website → /demo/[slug]. */}
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
        Product preview · placeholder
      </p>
      <div className="mt-4 rounded-xl border border-slate-200/90 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" aria-hidden />
          <span className="ml-2 truncate font-mono text-[11px] text-slate-500">
            localleadster.com/demo/…
          </span>
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-3 w-2/5 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-8 w-4/5 rounded bg-slate-900/90 dark:bg-white/90" />
          <div className="h-2.5 w-full rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-2.5 w-5/6 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="aspect-[4/3] rounded-lg bg-indigo-100 dark:bg-indigo-900/40" />
            <div className="aspect-[4/3] rounded-lg bg-violet-100 dark:bg-violet-900/40" />
            <div className="aspect-[4/3] rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Wireframe stand-in until we add a captured demo of the live generator.
      </p>
    </div>
  );
}
