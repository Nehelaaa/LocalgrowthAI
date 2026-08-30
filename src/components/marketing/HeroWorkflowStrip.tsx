const steps = ["Search territory", "Qualify leads", "Invoice & get paid", "Close deals"] as const;

/** Minimal conversion-focused strip directly under the hero. */
export function HeroWorkflowStrip() {
  return (
    <div
      className="border-b border-slate-200/90 bg-white/80 backdrop-blur-[2px] dark:border-slate-800/90 dark:bg-slate-950/40"
      role="navigation"
      aria-label="Core prospecting workflow"
    >
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-6">
        <ol className="flex list-none flex-wrap items-center justify-center gap-y-2 text-center">
          {steps.map((label, i) => (
            <li key={label} className="flex items-center">
              {i > 0 ? (
                <span className="px-3 text-[11px] font-medium text-slate-300 sm:text-xs dark:text-slate-600" aria-hidden>
                  →
                </span>
              ) : null}
              <span className="text-[13px] font-semibold tracking-tight text-slate-800 dark:text-slate-100">{label}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[13px]">
          From local list to paid invoice — without juggling five tools.
        </p>
      </div>
    </div>
  );
}
