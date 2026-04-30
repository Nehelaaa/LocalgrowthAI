"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const steps = [
  {
    id: 1,
    title: "Search a territory",
    body: "Pick city, state, radius, and industry. We pull live Google Places data so you only talk to real businesses in your service area.",
    eyebrow: "Google Places search",
    accent: "indigo" as const,
  },
  {
    id: 2,
    title: "Flag & score leads",
    body: "Instantly see who has no real website or only social. HOT / WARM / COLD scores help you prioritize the best opportunities first.",
    eyebrow: "Qualification signals",
    accent: "amber" as const,
  },
  {
    id: 3,
    title: "Run your pipeline",
    body: "Track contact status, notes, follow-up dates, and value in a built-in CRM. No more scattered spreadsheets for your web dev sales.",
    eyebrow: "Simple CRM pipeline",
    accent: "emerald" as const,
  },
  {
    id: 4,
    title: "Export & scale (Pro)",
    body: "When you’re ready to collaborate or automate, export CSV or use the JSON endpoint to push leads into Sheets, Airtable, Zapier/Make, or your CRM.",
    eyebrow: "Exports + automation",
    accent: "violet" as const,
  },
];

export function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const s = steps[active]!;
  const ids = useMemo(() => steps.map((x) => `how-step-${x.id}`), []);
  const panelIds = useMemo(() => steps.map((x) => `how-panel-${x.id}`), []);
  const tablistRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = tablistRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      setActive((prev) => {
        const next = e.key === "ArrowRight" ? prev + 1 : prev - 1;
        return (next + steps.length) % steps.length;
      });
    };
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 py-16 dark:border-slate-800/80 dark:from-slate-950 dark:to-slate-900/50 sm:py-24"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="how-heading"
          className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl dark:text-white"
        >
          How LocalLeadster works
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-600 dark:text-slate-400">
          Four simple steps from search to close. Click a step to explore — use arrow keys too.
        </p>

        <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start">
          <div
            ref={tablistRef}
            className="w-full lg:max-w-sm"
            role="tablist"
            aria-label="How it works steps"
            tabIndex={0}
          >
            <ol className="flex flex-col gap-2" role="list">
              {steps.map((step, i) => {
                const on = i === active;
                const tone =
                  step.accent === "amber"
                    ? "border-amber-400/35 bg-amber-50/70 ring-amber-500/15 dark:border-amber-500/25 dark:bg-amber-500/10"
                    : step.accent === "emerald"
                      ? "border-emerald-400/35 bg-emerald-50/60 ring-emerald-500/15 dark:border-emerald-500/25 dark:bg-emerald-500/10"
                      : step.accent === "violet"
                        ? "border-violet-400/35 bg-violet-50/60 ring-violet-500/15 dark:border-violet-500/25 dark:bg-violet-500/10"
                        : "border-indigo-400/35 bg-indigo-50/70 ring-indigo-500/15 dark:border-indigo-500/25 dark:bg-indigo-500/10";

                return (
                  <li key={step.id}>
                    <button
                      id={ids[i]}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      aria-controls={panelIds[i]}
                      tabIndex={on ? 0 : -1}
                      onClick={() => setActive(i)}
                      className={
                        "group w-full rounded-2xl border p-4 text-left transition " +
                        (on
                          ? `${tone} shadow-md ring-2`
                          : "border-slate-200/80 bg-white/60 hover:border-slate-300 hover:bg-white/80 dark:border-slate-700/50 dark:bg-slate-900/30 dark:hover:border-slate-600 dark:hover:bg-slate-900/40")
                      }
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={
                            "mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl text-xs font-extrabold " +
                            (on
                              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100")
                          }
                        >
                          {step.id}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {step.eyebrow}
                          </p>
                          <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                            {step.title}
                          </p>
                          {on && (
                            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                              {step.body}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700/50">
                        <div
                          className={
                            "h-full rounded-full transition-all duration-300 " +
                            (on ? "w-full bg-slate-900 dark:bg-white" : "w-0")
                          }
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div
            id={panelIds[active]}
            role="tabpanel"
            aria-labelledby={ids[active]}
            className="relative flex-1 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 shadow-xl ring-1 ring-slate-900/5 backdrop-blur dark:border-slate-700/50 dark:bg-slate-900/40 dark:ring-white/5 sm:min-h-[340px] lg:min-h-[420px]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_20%,rgba(99,102,241,0.14),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_30%_20%,rgba(99,102,241,0.12),transparent)]" />
            <div className="relative p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                    Step {s.id}
                  </p>
                  <p className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                    {s.title}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  {s.id === 1 && <Pill>City + radius + category</Pill>}
                  {s.id === 2 && <Pill>Signals + tiers</Pill>}
                  {s.id === 3 && <Pill>Pipeline + follow-ups</Pill>}
                  {s.id === 4 && <Pill>CSV + JSON exports</Pill>}
                </div>
              </div>

              <div className="mt-5">
                {s.id === 1 && <VisualSearch />}
                {s.id === 2 && <VisualScore />}
                {s.id === 3 && <VisualPipeline />}
                {s.id === 4 && <VisualExport />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 dark:border-slate-700/60 dark:bg-slate-900/40">
      {children}
    </span>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/40">
      <div className="flex items-center gap-1.5 border-b border-slate-200/70 bg-white/80 px-3 py-2 dark:border-slate-800/70 dark:bg-slate-900/30">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" aria-hidden />
        <span className="ml-2 flex-1 truncate rounded-md bg-slate-100 px-2 py-0.5 text-center text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          localleadster.app
        </span>
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  );
}

function VisualSearch() {
  return (
    <Frame>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="rounded-md bg-indigo-100 px-2 py-1 text-indigo-900 dark:bg-indigo-500/15 dark:text-indigo-200">
            Austin, TX
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            10 mi
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Plumbers
          </span>
          <span className="rounded-md bg-emerald-100 px-2 py-1 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200">
            No website
          </span>
        </div>
        <div className="grid gap-2">
          {[
            { n: "Apex Plumbing Co.", tag: "No site", hot: true },
            { n: "QuickFix Drains", tag: "Social only", hot: false },
            { n: "City Rooter LLC", tag: "No site", hot: true },
          ].map((r) => (
            <div
              key={r.n}
              className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm dark:border-slate-700/50 dark:bg-slate-900/30"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900 dark:text-white">{r.n}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{r.tag}</p>
              </div>
              <div className="flex items-center gap-2">
                {r.hot && (
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-extrabold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
                    HOT
                  </span>
                )}
                <span className="rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-extrabold text-white">
                  + Save
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

function VisualScore() {
  return (
    <Frame>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700/50 dark:bg-slate-900/30">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Signals
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {[
              { l: "No website", v: "Yes", tone: "emerald" },
              { l: "Reviews", v: "180", tone: "slate" },
              { l: "Rating", v: "4.6", tone: "slate" },
              { l: "Tier", v: "HOT", tone: "amber" },
            ].map((x) => (
              <div key={x.l} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/40">
                <span className="text-slate-600 dark:text-slate-300">{x.l}</span>
                <span
                  className={
                    "rounded-full px-2.5 py-1 text-[11px] font-extrabold " +
                    (x.tone === "emerald"
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200"
                      : x.tone === "amber"
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
                        : "bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100")
                  }
                >
                  {x.v}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700/50 dark:bg-slate-900/30">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Recommended next step
          </p>
          <div className="mt-3 space-y-2">
            <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/80 p-3 text-sm dark:border-indigo-500/30 dark:bg-indigo-500/10">
              <p className="font-semibold text-indigo-950 dark:text-indigo-100">Send first touch</p>
              <p className="mt-1 text-[12px] leading-relaxed text-indigo-900/80 dark:text-indigo-200/80">
                “Great reviews — I noticed you don’t have a website yet. Want a quick 10‑min call?”
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              {["Email", "Call", "DM", "Loom"].map((x) => (
                <span
                  key={x}
                  className="rounded-full border border-slate-200/80 bg-white px-3 py-1 dark:border-slate-700/60 dark:bg-slate-900/40"
                >
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function VisualPipeline() {
  return (
    <Frame>
      <div className="grid gap-3 lg:grid-cols-3">
        {[
          { t: "New", tone: "slate", items: ["City Rooter LLC", "Greenway Plumbing"] },
          { t: "Contacted", tone: "sky", items: ["Apex Plumbing Co."] },
          { t: "Follow-up", tone: "amber", items: ["QuickFix Drains"] },
        ].map((col) => (
          <div key={col.t} className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700/50 dark:bg-slate-900/30">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                {col.t}
              </p>
              <span
                className={
                  "rounded-full px-2 py-0.5 text-[10px] font-extrabold " +
                  (col.tone === "amber"
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
                    : col.tone === "sky"
                      ? "bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200"
                      : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200")
                }
              >
                {col.items.length}
              </span>
            </div>
            <div className="mt-2 space-y-2">
              {col.items.map((x) => (
                <div
                  key={x}
                  className="rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/40 dark:text-white"
                >
                  {x}
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Next: follow up Thu
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function VisualExport() {
  return (
    <Frame>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-violet-200/60 bg-violet-50/70 p-3 dark:border-violet-500/25 dark:bg-violet-500/10">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-violet-700 dark:text-violet-200">
            Export
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
            Push your lead list into the tools you already use. Keep LocalLeadster as the source‑of‑truth — export
            when you need to collaborate or automate.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold text-violet-800 dark:text-violet-200">
            {["CSV", "JSON", "Sheets", "Airtable"].map((x) => (
              <span key={x} className="rounded-full bg-white/80 px-3 py-1 dark:bg-slate-900/40">
                {x}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700/50 dark:bg-slate-900/30">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Endpoints
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/40">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">CSV export</span>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-extrabold text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200">
                  Ready
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/40">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">JSON endpoint</span>
                <span className="rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-extrabold text-white">
                  /api/export/leads
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Use automation tools to sync leads where your team works.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700/50 dark:bg-slate-900/30">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Works with
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Google Sheets", "Airtable", "Zapier", "Make"].map((x) => (
                <span
                  key={x}
                  className="rounded-full border border-slate-200/80 bg-white px-3 py-1 text-[10px] font-semibold text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200"
                >
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}
