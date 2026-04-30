"use client";

import { useState } from "react";

const tabs = [
  { id: "search" as const, label: "Find" },
  { id: "crm" as const, label: "Score & CRM" },
  { id: "ai" as const, label: "AI & close" },
];

export function ProductMockup() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("search");
  return (
    <div
      className="relative mx-auto w-full max-w-lg rounded-2xl border border-slate-200/90 bg-slate-50 shadow-2xl ring-1 ring-slate-900/5 dark:border-slate-700/80 dark:bg-slate-900/90 dark:ring-white/5"
      role="region"
      aria-label="Product interface preview"
    >
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 bg-white/90 px-3 py-2.5 dark:border-slate-800/80 dark:bg-slate-900/50">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" aria-hidden />
        <span className="ml-2 flex-1 truncate rounded-md bg-slate-100 px-2 py-0.5 text-center text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          app.localleadster.com/dashboard
        </span>
      </div>
      <div className="flex border-b border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/40">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              "min-h-[40px] flex-1 border-b-2 px-2 text-xs font-semibold transition sm:text-sm " +
              (tab === t.id
                ? "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-3 sm:p-4">
        {tab === "search" && <PanelSearch />}
        {tab === "crm" && <PanelCrm />}
        {tab === "ai" && <PanelAi />}
      </div>
    </div>
  );
}

function PanelSearch() {
  return (
    <div className="space-y-2 text-left">
      <div className="flex flex-wrap gap-1.5 text-[10px] sm:text-xs">
        <span className="rounded-md bg-violet-100 px-2 py-1 font-medium text-violet-800 dark:bg-violet-500/20 dark:text-violet-200">
          Austin, TX
        </span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          10 mi
        </span>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          Plumbers
        </span>
      </div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Results
      </p>
      {[
        { name: "Apex Plumbing Co.", tag: "No site", hot: true },
        { name: "QuickFix Drains", tag: "Social only", hot: false },
        { name: "City Rooter LLC", tag: "No site", hot: true },
      ].map((r) => (
        <div
          key={r.name}
          className="group flex items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-white px-2.5 py-2 text-xs transition hover:border-indigo-200 hover:shadow-sm dark:border-slate-700/50 dark:bg-slate-900/50 dark:hover:border-indigo-500/30"
        >
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{r.name}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{r.tag}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {r.hot && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                HOT
              </span>
            )}
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-[9px] font-semibold text-indigo-800 group-hover:bg-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200">
              + Save
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelCrm() {
  return (
    <div className="space-y-2 text-left">
      <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] sm:text-[10px]">
        {[
          { v: "11", l: "Leads" },
          { v: "8", l: "No site" },
          { v: "0%", l: "Convert" },
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
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Pipeline
      </p>
      {[
        { n: "Apex Plumbing", st: "Contacted", b: "WARM" },
        { n: "City Rooter", st: "New", b: "HOT" },
      ].map((r) => (
        <div
          key={r.n}
          className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white px-2.5 py-2 text-xs dark:border-slate-700/50 dark:bg-slate-900/50"
        >
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{r.n}</p>
            <p className="text-[10px] text-slate-500">{r.st}</p>
          </div>
          <span
            className={
              "rounded px-1.5 py-0.5 text-[9px] font-bold " +
              (r.b === "HOT"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
                : "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200")
            }
          >
            {r.b}
          </span>
        </div>
      ))}
    </div>
  );
}

function PanelAi() {
  return (
    <div className="space-y-2 text-left text-xs">
      <div className="rounded-lg border border-indigo-200/60 bg-indigo-50/80 p-2.5 dark:border-indigo-500/30 dark:bg-indigo-500/10">
        <p className="text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-300">
          AI — Email draft
        </p>
        <p className="mt-1 text-[10px] leading-relaxed text-slate-700 dark:text-slate-200">
          Hi [Name] — I noticed [Business] has great reviews but no site yet. I help local [Trade] in
          [City] get found online. Worth a 10-min call?
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        {["Email", "Call", "DM", "Loom"].map((x) => (
          <span
            key={x}
            className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            {x}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">
        Pro: generate + export + client demo pages in one flow.
      </p>
    </div>
  );
}
