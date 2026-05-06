import { MarketingReveal } from "./MarketingReveal";
import { MarketingPipelineLeadsMockup } from "./MarketingPipelineLeadsMockup";
import { IconBolt, IconClock, IconStack, IconTarget } from "./MarketingSectionIcons";

const bullets = [
  {
    title: "List-building, not map tourism",
    desc: "LocalLeadster is built for volume: run a territory once, then refine — not fifty browser tabs.",
    Icon: IconClock,
  },
  {
    title: "Signals before you dial",
    desc: "Spot weak-site and social-first businesses so your call sheet isn’t blind cold outreach.",
    Icon: IconTarget,
  },
  {
    title: "Why Maps breaks down",
    desc: "Directions and discovery are unrelated to pipeline stages — context lives in LocalLeadster, not pin history.",
    Icon: IconStack,
  },
] as const;

export function MarketingMapsCompareSection() {
  return (
    <section
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6 sm:py-14"
      aria-labelledby="maps-compare-heading"
    >
      <MarketingReveal>
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="order-2 flex justify-center lg:order-1 lg:justify-start">
            <MarketingPipelineLeadsMockup />
          </div>

          <div className="order-1 min-w-0 lg:order-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              vs. manual Google Maps
            </p>
            <h2
              id="maps-compare-heading"
              className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white"
            >
              Built for pipeline work — not endless clicking
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Google Maps answers “where.”</span> Selling
              to local businesses answers “who’s worth a call?” — LocalLeadster is for that repeatable list.
            </p>

            <ul className="mt-6 space-y-4" role="list">
              {bullets.map(({ title, desc, Icon }) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-6 inline-flex items-center gap-2 rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-3 py-2 text-xs font-medium text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-100">
              <IconBolt className="h-4 w-4 shrink-0" />
              Trade the scrolling loop for a territory you can re-run anytime.
            </p>
          </div>
        </div>
      </MarketingReveal>
    </section>
  );
}
