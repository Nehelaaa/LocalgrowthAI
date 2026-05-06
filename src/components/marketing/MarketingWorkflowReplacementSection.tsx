import { MarketingReveal } from "./MarketingReveal";

const messy = [
  "Maps tabs + spreadsheet rows",
  "Qualification happens in your head",
  "Follow-ups scattered across notes & chat",
  "Separate CRM + invoicing",
];

const unified = [
  "Territory runs + qualification signals",
  "Pipeline stages, next actions, follow-up tracking",
  "Live call-sheet clarity — one organized workspace",
  "Branded PDFs when deals turn into invoices",
];

export function MarketingWorkflowReplacementSection() {
  return (
    <section
      className="border-y border-slate-200/80 bg-gradient-to-b from-white to-slate-50/90 py-10 dark:border-slate-800/80 dark:from-slate-950 dark:to-slate-900/50 sm:py-14"
      aria-labelledby="workflow-replace-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <MarketingReveal>
          <div className="text-center">
            <h2
              id="workflow-replace-heading"
              className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white"
            >
              One workspace — not five tools duct-taped together
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Stop stitching Maps, spreadsheets, and a bolt-on CRM. Keep leads, outreach, and billing context in{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">one workspace</span>.
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-lg gap-3 sm:max-w-2xl sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Patchwork
              </p>
              <ul className="mt-3 space-y-2.5 text-sm text-slate-700 dark:text-slate-300" role="list">
                {messy.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="text-slate-400" aria-hidden>
                      —
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/90 to-white p-5 shadow-sm dark:border-indigo-500/25 dark:from-indigo-950/35 dark:to-slate-900/50">
              <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                LocalLeadster
              </p>
              <ul className="mt-3 space-y-2.5 text-sm text-slate-800 dark:text-slate-200" role="list">
                {unified.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400" aria-hidden>
                      ✓
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </MarketingReveal>
      </div>
    </section>
  );
}
