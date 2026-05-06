"use client";

import { useMemo, useState } from "react";
import { BusinessSearchForm } from "@/app/dashboard/search/BusinessSearchForm";
import {
  defaultPlaceFilterState,
  filterAndSortPlaces,
  type PlaceFilterState,
  type PlaceRow,
} from "@/lib/place-search-scoring";
import { contactStatusLabel, contactStatusPillClass } from "@/lib/contact-status";
import { InvoiceDocumentPreview } from "@/components/invoices/InvoiceDocumentPreview";

const tabs = [
  { id: "search" as const, label: "Find" },
  { id: "crm" as const, label: "Leads" },
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

        <div className="p-3 sm:p-4">
          <div key={tab} className="lgai-mock-fade">
            {tab === "search" && <PanelSearch />}
            {tab === "crm" && <PanelCrm />}
            {tab === "invoice" && <PanelInvoice />}
            {tab === "close" && <PanelClose />}
          </div>
        </div>
      </div>

    </div>
  );
}

function PanelSearch() {
  const [filters] = useState<PlaceFilterState>(() => defaultPlaceFilterState());
  const places = useMemo<PlaceRow[]>(
    () => [
      {
        placeId: "demo-apex-plumbing",
        name: "Apex Plumbing Co.",
        address: "123 Main St, Austin, TX",
        city: "Austin",
        state: "TX",
        phone: "(512) 555-0137",
        website: undefined,
        rating: 4.8,
        reviewCount: 126,
        googleMapsUrl: "https://www.google.com/maps",
        businessType: "plumber",
        hasSocialOnly: false,
        noWebsite: true,
        photoUrl: undefined,
      },
      {
        placeId: "demo-quickfix-drains",
        name: "QuickFix Drains",
        address: "220 Congress Ave, Austin, TX",
        city: "Austin",
        state: "TX",
        phone: "(512) 555-0189",
        website: "https://instagram.com/quickfixdrains",
        rating: 4.6,
        reviewCount: 74,
        googleMapsUrl: "https://www.google.com/maps",
        businessType: "plumber",
        hasSocialOnly: true,
        noWebsite: true,
        photoUrl: undefined,
      },
      {
        placeId: "demo-city-rooter",
        name: "City Rooter LLC",
        address: "500 E 6th St, Austin, TX",
        city: "Austin",
        state: "TX",
        phone: "(512) 555-0104",
        website: undefined,
        rating: 4.9,
        reviewCount: 203,
        googleMapsUrl: "https://www.google.com/maps",
        businessType: "plumber",
        hasSocialOnly: false,
        noWebsite: true,
        photoUrl: undefined,
      },
    ],
    []
  );
  const filtered = useMemo(() => filterAndSortPlaces(places, filters), [places, filters]);

  return (
    <div className="space-y-2 text-left">
      <div className="rounded-xl border border-slate-200/80 bg-white/80 p-2.5 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/40">
        <BusinessSearchForm
          onSearch={async () => {}}
          loading={false}
          embedded
          initialCity="Austin"
          initialState="TX"
          initialRadiusMiles={10}
          initialBusinessType="plumber"
        />
      </div>
      <MiniResultsPreview places={filtered.slice(0, 3)} />
    </div>
  );
}

function PanelInvoice() {
  const accentHex = "#f59e0b";
  return (
    <div className="text-left text-xs">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Invoice preview (real PDF layout)
      </p>
      <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/50 dark:bg-slate-900/40">
        <div className="border-b border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-slate-800/80 dark:bg-slate-950/20">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              Apex Plumbing Co. — Invoice
            </p>
            <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white">
              Download PDF
            </span>
          </div>
        </div>
        {/* Desktop-like preview: wider and less cropped */}
        <div className="relative h-[390px] bg-[radial-gradient(ellipse_at_top,_rgb(248_250_252)_0%,_rgb(241_245_249)_100%)] p-3 dark:bg-[radial-gradient(ellipse_at_top,_rgb(15_23_42)_0%,_rgb(2_6_23)_100%)]">
          <div className="absolute inset-0 opacity-60 [mask-image:radial-gradient(circle_at_35%_20%,black,transparent_65%)]" aria-hidden>
            <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.12)_0%,transparent_62%)]" />
          </div>
          <div className="relative mx-auto h-full w-full max-w-[760px] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg dark:border-slate-700/60 dark:bg-slate-900">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 origin-top scale-[1.12] [transform-origin:top]">
              <InvoiceDocumentPreview
                templateId="statement"
                accentHex={accentHex}
                businessName="Apex Plumbing Co."
                logoDataUrl={null}
                density="comfortable"
                documentTitle="Invoice"
                footerPhrase="Thanks for your business"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelCrm() {
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

      {[
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
      ].map((r) => (
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

function MiniResultsPreview({ places }: { places: PlaceRow[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Results preview
      </p>
      <div className="space-y-2">
        {places.map((p) => (
          <div
            key={p.placeId}
            className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs shadow-sm dark:border-slate-700/50 dark:bg-slate-900/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900 dark:text-white">{p.name}</p>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  ★ {(p.rating ?? 0).toFixed(1)} ({p.reviewCount})
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{p.phone ?? "—"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {p.hasSocialOnly && (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-800 dark:bg-sky-500/20 dark:text-sky-200">
                    Social only
                  </span>
                )}
                {p.noWebsite && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
                    No website
                  </span>
                )}
                <span className="rounded bg-indigo-100 px-2 py-0.5 text-[9px] font-semibold text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200">
                  + Save
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
