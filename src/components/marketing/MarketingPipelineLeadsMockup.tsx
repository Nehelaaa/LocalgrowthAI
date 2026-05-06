import { contactStatusLabel, contactStatusPillClass } from "@/lib/contact-status";

const LEAD_ROWS = [
  {
    name: "Apex Plumbing Co.",
    badge: "WARM" as const,
    status: "CONTACTED" as const,
    value: "$1,800",
    follow: "Thu",
    score: 78,
  },
  {
    name: "City Rooter LLC",
    badge: "HOT" as const,
    status: "INTERESTED" as const,
    value: "$2,400",
    follow: "Mon",
    score: 92,
  },
  {
    name: "QuickFix Drains",
    badge: "COLD" as const,
    status: "NOT_CONTACTED" as const,
    value: "—",
    follow: "—",
    score: 61,
  },
  {
    name: "Lakeview Dental",
    badge: "HOT" as const,
    status: "CONTACTED" as const,
    value: "$3,200",
    follow: "Fri",
    score: 88,
  },
] as const;

/** Leads tab body — shared by `ProductMockup` and marketing pipeline section. */
export function MarketingLeadsPanelContent() {
  return (
    <div className="space-y-2 text-left">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Leads (same badges + status pills)
      </p>
      <div className="grid grid-cols-3 gap-2 text-center text-[9px] sm:text-[10px]">
        {[
          { v: "11", l: "Leads" },
          { v: "8", l: "No site" },
          { v: "2", l: "Hot" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-lg border border-slate-200/80 bg-white p-1.5 dark:border-slate-700/50 dark:bg-slate-900/50"
          >
            <p className="text-sm font-bold text-slate-900 dark:text-white">{s.v}</p>
            <p className="text-slate-500 dark:text-slate-400">{s.l}</p>
          </div>
        ))}
      </div>

      {LEAD_ROWS.map((r) => (
        <div
          key={r.name}
          className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs shadow-sm dark:border-slate-700/50 dark:bg-slate-900/50"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{r.name}</p>
              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                Score{" "}
                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">{r.score}</span>
                {" · "}Website price{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{r.value}</span>
                {" · "}Follow-up{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{r.follow}</span>
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span
                className={
                  "rounded px-2 py-0.5 text-[10px] font-extrabold " +
                  (r.badge === "HOT"
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
                    : r.badge === "WARM"
                      ? "bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200")
                }
              >
                {r.badge}
              </span>
              <span
                className={
                  "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold " +
                  contactStatusPillClass[r.status]
                }
              >
                {contactStatusLabel[r.status]}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Static LocalLeadster-style Leads preview (browser chrome only — no Find/Close tabs) for marketing sections.
 * Display-only — no client state.
 */
export function MarketingPipelineLeadsMockup() {
  return (
    <div
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50 shadow-2xl ring-1 ring-slate-900/5 dark:border-slate-700/80 dark:bg-slate-900/90 dark:ring-white/5 lg:max-w-lg"
      role="img"
      aria-label="LocalLeadster Leads preview: pipeline summary, lead scores, HOT WARM COLD tiers, and outreach status pills"
    >
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 bg-white/90 px-3 py-2.5 dark:border-slate-800/80 dark:bg-slate-900/50">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" aria-hidden />
        <span className="ml-2 flex-1 truncate rounded-md bg-slate-100 px-2 py-0.5 text-center text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          localleadster.com/dashboard
        </span>
      </div>
      <div className="relative bg-white/70 dark:bg-slate-900/30">
        <div className="border-b border-slate-200/80 bg-white/80 px-3 pt-2 dark:border-slate-800/80 dark:bg-slate-900/40">
          <div className="inline-flex border-b-2 border-indigo-600 pb-2 text-xs font-semibold text-indigo-700 dark:border-indigo-400 dark:text-indigo-300 sm:text-sm">
            Leads
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <MarketingLeadsPanelContent />
        </div>
      </div>
    </div>
  );
}
