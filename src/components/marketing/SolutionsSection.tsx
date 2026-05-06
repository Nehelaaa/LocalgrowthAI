import Link from "next/link";
import { IllustrationOutreach, IllustrationPipeline, IllustrationRadar } from "./Illustrations";

const solutions = [
  {
    href: "/for/freelancers",
    title: "Freelancers",
    desc: "Replace nights lost to Maps + spreadsheets: find local prospects fast, qualify with signals, and keep follow-ups in one pipeline.",
    Illustration: IllustrationRadar,
    bullets: ["Prospect faster with territory runs", "Save + score leads in minutes", "Invoice from the same row"],
  },
  {
    href: "/for/agencies",
    title: "Agencies & teams",
    desc: "Turn repeatable territory searches into predictable pipeline — CRM stages, exports, branded PDFs, and Pro billing when you scale.",
    Illustration: IllustrationPipeline,
    bullets: ["Pipeline stages everyone can see", "Follow-up accountability", "Stripe billing on Pro"],
  },
  {
    href: "/for/sales",
    title: "B2B sales & setters",
    desc: "Build targeted lists, segment by opportunity signals, and keep your call sheet current — stop manually rebuilding the same Google Maps loop.",
    Illustration: IllustrationOutreach,
    bullets: ["Fresh call-sheet after every run", "Presets sharpen the list", "Outcomes logged on the lead"],
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
        Built for teams who need outcomes
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-600 dark:text-slate-400 sm:text-base">
        Choose the playbook closest to how you sell. Each keeps prospecting and outreach inside{" "}
        <span className="font-medium text-slate-800 dark:text-slate-200">one LocalLeadster workspace</span>.
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

