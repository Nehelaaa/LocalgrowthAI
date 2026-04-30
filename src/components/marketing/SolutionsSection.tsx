import Link from "next/link";
import { IllustrationOutreach, IllustrationPipeline, IllustrationRadar } from "./Illustrations";

const solutions = [
  {
    href: "/for/freelancers",
    title: "Freelance web devs",
    desc: "Find local businesses, qualify fast, and keep your follow-ups in one clean pipeline.",
    Illustration: IllustrationRadar,
    bullets: ["Spot weak web presence", "Save + score leads", "Simple follow-up workflow"],
  },
  {
    href: "/for/agencies",
    title: "Agencies & teams",
    desc: "Turn territory searches into predictable meetings — with CRM stages, exports, and secure Pro billing.",
    Illustration: IllustrationPipeline,
    bullets: ["Team-ready pipeline", "Exports to your stack", "Stripe billing on Pro"],
  },
  {
    href: "/for/sales",
    title: "B2B sales & setters",
    desc: "Build targeted lists, segment by signals, and keep your call sheet up to date daily.",
    Illustration: IllustrationOutreach,
    bullets: ["Daily prospecting", "Prioritize with tiers", "Track outcomes"],
  },
] as const;

export function SolutionsSection() {
  return (
    <section
      id="solutions"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20"
      aria-labelledby="solutions-heading"
    >
      <h2
        id="solutions-heading"
        className="text-center text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white"
      >
        Built for anyone selling to local businesses
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600 dark:text-slate-400">
        Same workflow. Different offers. Pick a starting point — the product stays simple.
      </p>

      <ul className="mt-10 grid gap-4 lg:grid-cols-3" role="list">
        {solutions.map((s) => (
          <li
            key={s.href}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/50"
          >
            <div className="relative border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/80 to-white p-4 dark:border-slate-800/70 dark:from-indigo-950/30 dark:to-slate-900/30">
              <s.Illustration className="h-40 w-full" />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {s.desc}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {s.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="mt-0.5 text-emerald-600" aria-hidden>
                      ✓
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <Link
                  href={s.href}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition group-hover:border-indigo-300 group-hover:bg-indigo-50/70 dark:border-slate-700/70 dark:bg-slate-900/30 dark:text-slate-100 dark:group-hover:border-indigo-500/40"
                >
                  View this playbook
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

