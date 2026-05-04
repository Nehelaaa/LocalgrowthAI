"use client";

import { useState } from "react";

const tabs = [
  { id: "search" as const, label: "Find" },
  { id: "crm" as const, label: "CRM" },
  { id: "invoice" as const, label: "Invoices" },
  { id: "close" as const, label: "Close" },
];

export function ProductMockup() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("search");
  return (
    <div
      className="relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50 shadow-2xl ring-1 ring-slate-900/5 dark:border-slate-700/80 dark:bg-slate-900/90 dark:ring-white/5"
      role="region"
      aria-label="Product interface preview"
    >
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 bg-white/90 px-3 py-2.5 dark:border-slate-800/80 dark:bg-slate-900/50">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" aria-hidden />
        <span className="ml-2 flex-1 truncate rounded-md bg-slate-100 px-2 py-0.5 text-center text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          www.localleadster.com/dashboard
        </span>
      </div>
      <div className="relative bg-white/70 dark:bg-slate-900/30">
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

        <div className="p-3 sm:p-4 sm:pr-[236px]">
          <div key={tab} className="lgai-mock-fade">
            {tab === "search" && <PanelSearch />}
            {tab === "crm" && <PanelCrm />}
            {tab === "invoice" && <PanelInvoice />}
            {tab === "close" && <PanelClose />}
          </div>
        </div>

        {/* Lightweight “selling” callouts for first-glance clarity */}
        <div className="pointer-events-none absolute right-3 top-[64px] hidden w-[210px] space-y-2 sm:block">
          {tab === "search" && (
            <>
              <Callout title="Google-business results" body="Names, ratings, phone, and quick signals at a glance." />
              <Callout title="Save in one click" body="Build your pipeline while you search." tone="indigo" />
            </>
          )}
          {tab === "crm" && (
            <>
              <Callout title="Prioritize fast" body="HOT / WARM / COLD tiers + next step." />
              <Callout title="Active leads first" body="Interested & contacted rise to the top of your list." tone="indigo" />
            </>
          )}
          {tab === "invoice" && (
            <>
              <Callout title="Branded PDFs" body="Layouts, logo, and accent — saved once, used everywhere." />
              <Callout title="From the lead" body="Open any CRM row → build & download in seconds." tone="indigo" />
            </>
          )}
          {tab === "close" && (
            <>
              <Callout title="Track money in play" body="Deal value + close date per opportunity." />
              <Callout title="Close faster" body="See what’s closing this week and follow up on time." tone="indigo" />
            </>
          )}
        </div>
      </div>

    </div>
  );
}

function Callout({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone?: "indigo";
}) {
  const toneCls =
    tone === "indigo"
      ? "border-indigo-200/60 bg-indigo-50/80 text-indigo-950 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-100"
      : "border-slate-200/70 bg-white/85 text-slate-900 dark:border-slate-800/70 dark:bg-slate-900/55 dark:text-slate-100";
  return (
    <div className={"rounded-2xl border p-3 shadow-sm backdrop-blur " + toneCls}>
      <p className="text-[11px] font-extrabold tracking-tight">{title}</p>
      <p className="mt-1 text-[10px] leading-relaxed opacity-80">{body}</p>
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
        Google businesses
      </p>
      {[
        {
          name: "Apex Plumbing Co.",
          rating: 4.8,
          reviews: 126,
          addr: "South Austin • 2.1 mi",
          phone: "(512) 555‑0137",
          signal: "No website",
          hot: true,
        },
        {
          name: "QuickFix Drains",
          rating: 4.6,
          reviews: 74,
          addr: "East Austin • 4.0 mi",
          phone: "(512) 555‑0189",
          signal: "Social only",
          hot: false,
        },
        {
          name: "City Rooter LLC",
          rating: 4.9,
          reviews: 203,
          addr: "Central Austin • 3.3 mi",
          phone: "(512) 555‑0104",
          signal: "No website",
          hot: true,
        },
      ].map((r) => (
        <div
          key={r.name}
          className="group rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs transition hover:border-indigo-200 hover:shadow-sm dark:border-slate-700/50 dark:bg-slate-900/50 dark:hover:border-indigo-500/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{r.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  ★ {r.rating.toFixed(1)}
                </span>
                <span>({r.reviews})</span>
                <span className="opacity-60">•</span>
                <span>{r.addr}</span>
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{r.phone}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span
                className={
                  "rounded-full px-2 py-0.5 text-[9px] font-bold " +
                  (r.signal === "No website"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                    : "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200")
                }
              >
                {r.signal}
              </span>
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
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelInvoice() {
  return (
    <div className="space-y-2 text-left text-xs">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Invoice templates
      </p>
      <div className="flex flex-wrap gap-1">
        {["Minimal", "Ledger", "Statement"].map((x) => (
          <span
            key={x}
            className={
              "rounded-md px-2 py-0.5 text-[9px] font-semibold " +
              (x === "Statement"
                ? "bg-violet-600 text-white"
                : "border border-slate-200/80 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-300")
            }
          >
            {x}
          </span>
        ))}
      </div>
      <div className="rounded-lg border border-slate-200/80 bg-white p-2 dark:border-slate-700/50 dark:bg-slate-900/50">
        <p className="text-[10px] font-bold text-slate-900 dark:text-white">Apex Plumbing Co.</p>
        <p className="text-[9px] text-slate-500">Website build · $1,800</p>
        <button
          type="button"
          className="mt-2 w-full rounded-lg bg-indigo-600 py-1.5 text-[10px] font-bold text-white"
          disabled
        >
          Download PDF
        </button>
      </div>
      <p className="text-[9px] leading-relaxed text-slate-500 dark:text-slate-400">
        Match your PDF to the template you pick — plus live preview before you send.
      </p>
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

function PanelClose() {
  return (
    <div className="space-y-2 text-left text-xs">
      <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] sm:text-[10px]">
        {[
          { v: "$12.8k", l: "Pipeline" },
          { v: "$5.6k", l: "Closing" },
          { v: "$3.1k", l: "Won" },
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
        Closing this week
      </p>

      {[
        { n: "Lakeview Dental", st: "Proposal sent", v: "$2,400", tone: "emerald" as const },
        { n: "Austin Roofing Co", st: "Negotiation", v: "$3,200", tone: "amber" as const },
      ].map((r) => (
        <div
          key={r.n}
          className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs dark:border-slate-700/50 dark:bg-slate-900/50"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{r.n}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{r.st}</p>
          </div>
          <span
            className={
              "rounded-full px-2 py-0.5 text-[9px] font-extrabold " +
              (r.tone === "emerald"
                ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200"
                : "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200")
            }
          >
            {r.v}
          </span>
        </div>
      ))}

      <div className="rounded-lg border border-indigo-200/60 bg-indigo-50/80 p-2.5 dark:border-indigo-500/30 dark:bg-indigo-500/10">
        <p className="text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-300">
          Close faster
        </p>
        <p className="mt-1 text-[10px] leading-relaxed text-slate-700 dark:text-slate-200">
          Add deal value and a close date to every lead so you always know what revenue is in play.
        </p>
      </div>
    </div>
  );
}
