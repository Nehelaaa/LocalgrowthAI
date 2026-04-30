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
    q: "Exports made it easy to collaborate: we push lists into Sheets and keep the source-of-truth in the pipeline.",
    a: "Freelancer",
  },
] as const;

export function SocialProofSection() {
  return (
    <section
      className="border-y border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 py-14 dark:border-slate-800/80 dark:from-slate-950 dark:to-slate-900/40 sm:py-18"
      aria-labelledby="social-proof-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2
            id="social-proof-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white"
          >
            Built for real outreach — not vanity dashboards
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            Clear steps, simple signals, and one place to run your local pipeline every day.
          </p>
        </div>

        <ul className="mt-10 grid gap-4 lg:grid-cols-3" role="list">
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

