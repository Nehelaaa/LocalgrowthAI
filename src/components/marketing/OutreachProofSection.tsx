import Image from "next/image";

const quotes = [
  {
    q: "The workflow is fast: search → save → next step. It replaced our spreadsheet and kept follow-ups consistent.",
    a: "Agency owner",
  },
  {
    q: "Having a simple tier + pipeline view makes it obvious what to call next. No more losing context between tools.",
    a: "Sales lead",
  },
  {
    q: "Deal value on each lead keeps us focused on what’s worth chasing — everything stays in one pipeline.",
    a: "Freelancer",
  },
] as const;

export function OutreachProofSection() {
  return (
    <section
      id="value-prop"
      className="border-y border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 py-14 dark:border-slate-800/80 dark:from-slate-950 dark:to-slate-900/40 sm:py-20"
      aria-labelledby="outreach-proof-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2
            id="outreach-proof-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white"
          >
            Built for real outreach — not vanity dashboards
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            Search live businesses, qualify with signals and presets, keep every next step in one pipeline, and ship
            branded PDF invoices from the same lead row — so you can run local outreach daily without spreadsheet chaos.
          </p>
        </div>

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-200 shadow-lg dark:border-slate-700/50">
            <Image
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&q=80&auto=format&fit=crop"
              alt="Team collaborating with laptops"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="text-left">
            <p className="text-slate-600 dark:text-slate-400">
              LocalLeadster ties <span className="font-medium text-slate-800 dark:text-slate-200">search</span>,{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">scoring</span>,{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">follow-up</span>, and{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">client-ready PDFs</span> together so you
              always know who to contact next and why.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600" aria-hidden>
                  ✓
                </span>
                Live Google Places search in your territory with fast qualification signals and optional presets.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600" aria-hidden>
                  ✓
                </span>
                Per-lead history: status, notes, follow-ups, and context in one thread.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600" aria-hidden>
                  ✓
                </span>
                Invoice builder: pick a layout, drop a logo, download a PDF without leaving the lead.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600" aria-hidden>
                  ✓
                </span>
                Close tracking: deal value, next step, and what’s closing soon.
              </li>
            </ul>
          </div>
        </div>

        <ul className="mt-12 grid gap-4 lg:grid-cols-3" role="list">
          {quotes.map((x) => (
            <li
              key={x.q}
              className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/40"
            >
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">“{x.q}”</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {x.a}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
