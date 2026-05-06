import { MarketingReveal } from "./MarketingReveal";
import { IconBolt, IconClock, IconGlobe, IconSpark, IconStar, IconTarget } from "./MarketingSectionIcons";

const signals = [
  {
    title: "No website",
    desc: "Fast opener for rebuilds and GBP — tag the row, set next actions, and keep it moving through pipeline stages.",
    Icon: IconGlobe,
  },
  {
    title: "Weak SEO / thin presence",
    desc: "Pitch with proof on your call sheet — tiers make it obvious who earns follow-up this week.",
    Icon: IconTarget,
  },
  {
    title: "Low reviews",
    desc: "Trust and reputation angles you can log on the lead so follow-up tracking stays honest.",
    Icon: IconStar,
  },
  {
    title: "Social-only",
    desc: "Flags who still needs a real site — clean first touch when the daily list refreshes.",
    Icon: IconSpark,
  },
  {
    title: "Weak online presence",
    desc: "Stack signals with scoring so HOT / WARM / COLD matches who hits the call sheet first.",
    Icon: IconBolt,
  },
  {
    title: "Stale or outdated site",
    desc: "Neglected pages and broken flows are an easy modernization opener — tag the row, set next actions, and prioritize follow-up before the list refreshes.",
    Icon: IconClock,
  },
] as const;

export function MarketingOpportunitySignalsSection() {
  return (
    <section
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6 sm:py-14"
      aria-labelledby="signals-heading"
    >
      <MarketingReveal>
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              Local prospecting · qualification
            </p>
            <h2
              id="signals-heading"
              className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white"
            >
              Opportunity signals your call sheet runs on
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Decide who looks pitch-ready before anyone dials — then keep{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                tiers, pipeline stages, next actions, and follow-ups
              </span>{" "}
              on the same lead row in one workspace.
            </p>
          </div>

          <ul
            className="mx-auto mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:gap-4 lg:mx-0 lg:max-w-none lg:grid-flow-col lg:grid-rows-2 lg:auto-cols-fr lg:gap-5 xl:gap-6"
            role="list"
          >
            {signals.map(({ title, desc, Icon }) => (
              <li
                key={title}
                className="flex min-h-0 gap-3 rounded-xl border border-slate-200/90 bg-white/95 p-3.5 text-left shadow-sm ring-1 ring-slate-900/[0.04] dark:border-slate-800/80 dark:bg-slate-900/50 dark:ring-white/[0.05]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-100">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </MarketingReveal>
    </section>
  );
}
