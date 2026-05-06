"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BusinessSearchForm } from "@/app/dashboard/search/BusinessSearchForm";
import {
  defaultPlaceFilterState,
  filterAndSortPlaces,
  type PlaceFilterState,
  type PlaceRow,
} from "@/lib/place-search-scoring";
import { contactStatusLabel, contactStatusPillClass } from "@/lib/contact-status";

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
    body: "Track contact status, notes, follow-up dates, and value in a built-in CRM. Interested and contacted leads float to the top so you always see who you’re actively working.",
    eyebrow: "Simple CRM pipeline",
    accent: "emerald" as const,
  },
  {
    id: 4,
    title: "Brand & bill in one click",
    body: "Pick an invoice layout, logo, and accent color — then generate a client-ready PDF right from any lead. No extra design tool required.",
    eyebrow: "Branded PDF invoices",
    accent: "sky" as const,
  },
  {
    id: 5,
    title: "Close deals & track revenue",
    body: "Move opportunities to Won/Lost, set deal value, and see what’s closing this week. Keep your pipeline clean and know exactly how much money is in play.",
    eyebrow: "Closing + revenue",
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
          Five steps from search to close — including branded invoices. Click a step to explore — use arrow keys too.
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
                        : step.accent === "sky"
                          ? "border-sky-400/35 bg-sky-50/70 ring-sky-500/15 dark:border-sky-500/25 dark:bg-sky-500/10"
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
                  {s.id === 4 && <Pill>Templates + PDF</Pill>}
                  {s.id === 5 && <Pill>Won value + revenue</Pill>}
                </div>
              </div>

              <div className="mt-5">
                {s.id === 1 && <VisualSearch />}
                {s.id === 2 && <VisualScore />}
                {s.id === 3 && <VisualPipeline />}
                {s.id === 4 && <VisualInvoice />}
                {s.id === 5 && <VisualClose />}
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
  const [filters] = useState<PlaceFilterState>(() => defaultPlaceFilterState());

  const places = useMemo<PlaceRow[]>(
    () => [
      {
        placeId: "demo-apex-plumbing",
        name: "Apex Plumbing Co.",
        address: "123 Main St, Austin, TX",
        city: "Austin",
        state: "TX",
        phone: "(512) 555-0199",
        website: undefined,
        rating: 4.6,
        reviewCount: 180,
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
        phone: "(512) 555-0134",
        website: "https://instagram.com/quickfixdrains",
        rating: 4.2,
        reviewCount: 62,
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
        phone: "(512) 555-0177",
        website: undefined,
        rating: 4.9,
        reviewCount: 24,
        googleMapsUrl: "https://www.google.com/maps",
        businessType: "plumber",
        hasSocialOnly: false,
        noWebsite: true,
        photoUrl: undefined,
      },
    ],
    []
  );

  const filteredPlaces = useMemo(() => filterAndSortPlaces(places, filters), [places, filters]);

  return (
    <Frame>
      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm ring-1 ring-slate-900/[0.02] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/60 dark:ring-white/[0.03] sm:p-4">
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

        <ReadonlyResultsPreview places={filteredPlaces.slice(0, 3)} totalBeforeFilters={places.length} />
      </div>
    </Frame>
  );
}

function VisualScore() {
  const places = useMemo<PlaceRow[]>(
    () => [
      {
        placeId: "demo-lakeview-dental",
        name: "Lakeview Dental",
        address: "88 Barton Springs Rd, Austin, TX",
        city: "Austin",
        state: "TX",
        phone: "(512) 555-0111",
        website: undefined,
        rating: 4.8,
        reviewCount: 205,
        googleMapsUrl: "https://www.google.com/maps",
        businessType: "dentist",
        hasSocialOnly: false,
        noWebsite: true,
        photoUrl: undefined,
      },
      {
        placeId: "demo-austin-roofing",
        name: "Austin Roofing Co",
        address: "410 W 2nd St, Austin, TX",
        city: "Austin",
        state: "TX",
        phone: "(512) 555-0142",
        website: "https://austinroofing.example",
        rating: 4.4,
        reviewCount: 94,
        googleMapsUrl: "https://www.google.com/maps",
        businessType: "roofer",
        hasSocialOnly: false,
        noWebsite: false,
        photoUrl: undefined,
      },
      {
        placeId: "demo-greenway-plumbing",
        name: "Greenway Plumbing",
        address: "700 Guadalupe St, Austin, TX",
        city: "Austin",
        state: "TX",
        phone: "(512) 555-0166",
        website: undefined,
        rating: 4.7,
        reviewCount: 58,
        googleMapsUrl: "https://www.google.com/maps",
        businessType: "plumber",
        hasSocialOnly: false,
        noWebsite: true,
        photoUrl: undefined,
      },
      {
        placeId: "demo-sunrise-hair",
        name: "Sunrise Hair Studio",
        address: "100 E 7th St, Austin, TX",
        city: "Austin",
        state: "TX",
        phone: "(512) 555-0125",
        website: "https://instagram.com/sunrisehairstudio",
        rating: 4.5,
        reviewCount: 41,
        googleMapsUrl: "https://www.google.com/maps",
        businessType: "hair salon",
        hasSocialOnly: true,
        noWebsite: true,
        photoUrl: undefined,
      },
      {
        placeId: "demo-cedar-bakery",
        name: "Cedar Street Bakery",
        address: "2400 S 1st St, Austin, TX",
        city: "Austin",
        state: "TX",
        phone: "(512) 555-0109",
        website: "https://cedarstreetbakery.example",
        rating: 4.6,
        reviewCount: 132,
        googleMapsUrl: "https://www.google.com/maps",
        businessType: "bakery",
        hasSocialOnly: false,
        noWebsite: false,
        photoUrl: undefined,
      },
      {
        placeId: "demo-rapid-electric",
        name: "Rapid Electric",
        address: "1600 S Lamar Blvd, Austin, TX",
        city: "Austin",
        state: "TX",
        phone: "(512) 555-0181",
        website: undefined,
        rating: 4.3,
        reviewCount: 19,
        googleMapsUrl: "https://www.google.com/maps",
        businessType: "electrician",
        hasSocialOnly: false,
        noWebsite: true,
        photoUrl: undefined,
      },
    ],
    []
  );

  return (
    <Frame>
      <ReadonlyResultsPreview places={places} totalBeforeFilters={places.length} />
    </Frame>
  );
}

function VisualPipeline() {
  return (
    <Frame>
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              CRM leads
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
              Track status, score, and follow-ups
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-300">
            Preview
          </span>
        </div>

        <div className="space-y-3">
          {[
            {
              name: "Apex Plumbing Co.",
              city: "Austin",
              state: "TX",
              score: 92,
              badge: "HOT" as const,
              status: "INTERESTED" as const,
              websiteQuote: "$1,800",
              followUp: "Thu",
            },
            {
              name: "City Rooter LLC",
              city: "Austin",
              state: "TX",
              score: 78,
              badge: "WARM" as const,
              status: "CONTACTED" as const,
              websiteQuote: "$2,400",
              followUp: "Mon",
            },
            {
              name: "Greenway Plumbing",
              city: "Austin",
              state: "TX",
              score: 66,
              badge: "COLD" as const,
              status: "NOT_CONTACTED" as const,
              websiteQuote: "—",
              followUp: "—",
            },
            {
              name: "Sunrise Hair Studio",
              city: "Austin",
              state: "TX",
              score: 84,
              badge: "WARM" as const,
              status: "CONTACTED" as const,
              websiteQuote: "$1,200",
              followUp: "Fri",
            },
          ].map((lead) => (
            <div
              key={lead.name}
              className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700/80 dark:bg-slate-900/60 dark:ring-white/[0.05]"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-violet-50/80 to-white px-4 py-3 dark:border-slate-800 dark:from-violet-950/25 dark:to-slate-900/70">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{lead.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {lead.city}, {lead.state}
                  </p>
                </div>
                <div
                  className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-white shadow-inner shadow-slate-900/5 ring-1 ring-violet-200/60 dark:bg-slate-800 dark:ring-violet-500/20"
                  aria-label={`Score ${lead.score}`}
                >
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Score
                  </span>
                  <span className="text-base font-bold tabular-nums leading-none text-violet-700 dark:text-violet-300">
                    {lead.score}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                <span
                  className={
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold " +
                    (lead.badge === "HOT"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      : lead.badge === "WARM"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300")
                  }
                >
                  {lead.badge}
                </span>
                <span
                  className={
                    "inline-flex min-h-[1.75rem] items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium " +
                    contactStatusPillClass[lead.status]
                  }
                >
                  {contactStatusLabel[lead.status]}
                </span>
                <span className="ml-auto text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Website: <span className="font-semibold text-slate-800 dark:text-slate-100">{lead.websiteQuote}</span>
                  {" · "}Follow-up{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{lead.followUp}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

function VisualInvoice() {
  return (
    <Frame>
      <div className="grid gap-3 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700/50 dark:bg-slate-900/30">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Invoice templates
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["Minimal", "Ledger", "Statement", "Accent", "Editorial"].map((name) => (
              <span
                key={name}
                className={
                  "rounded-lg border px-2 py-1 text-[10px] font-semibold " +
                  (name === "Statement"
                    ? "border-violet-400 bg-violet-50 text-violet-900 dark:border-violet-500/40 dark:bg-violet-500/15 dark:text-violet-100"
                    : "border-slate-200/80 bg-white text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-300")
                }
              >
                {name}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            Logo, accent color, and layout stay saved — every PDF matches your brand.
          </p>
        </div>
        <div className="space-y-2">
          <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-white to-indigo-50/80 p-3 shadow-sm dark:border-indigo-500/25 dark:from-slate-900/40 dark:to-indigo-950/20">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                From any lead
              </p>
              <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[9px] font-bold text-white">
                Download PDF
              </span>
            </div>
            <div className="mt-2 rounded-lg border border-slate-200/80 bg-white/95 p-2.5 text-[10px] dark:border-slate-700/50 dark:bg-slate-900/50">
              <p className="font-bold text-slate-900 dark:text-white">INVOICE</p>
              <p className="mt-0.5 text-slate-600 dark:text-slate-300">Line items · tax · notes</p>
              <div className="mt-2 h-1.5 rounded bg-violet-500/85" aria-hidden />
            </div>
          </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-[10px] text-slate-600 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-300">
            Also new: refine results with presets (Easy Wins, High Value, Fast Closers) and stackable filters before you
            save.
          </div>
        </div>
      </div>
    </Frame>
  );
}

function VisualClose() {
  return (
    <Frame>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-violet-200/60 bg-violet-50/70 p-3 dark:border-violet-500/25 dark:bg-violet-500/10">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-violet-700 dark:text-violet-200">
            Revenue view
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
            Track deal value as you move leads through the pipeline. See what’s likely to close soon, and how much
            revenue you’ve won this month.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold text-violet-800 dark:text-violet-200">
            {["Deal value", "Close date", "Won/Lost", "Totals"].map((x) => (
              <span key={x} className="rounded-full bg-white/80 px-3 py-1 dark:bg-slate-900/40">
                {x}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700/50 dark:bg-slate-900/30">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Closing this week
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/40">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Lakeview Dental</span>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-extrabold text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200">
                  $2,400
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/40">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Austin Roofing Co</span>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-extrabold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
                  $3,200
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Prioritize the biggest deals and keep momentum with next steps.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700/50 dark:bg-slate-900/30">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Snapshot
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Pipeline: $12.8k", "Closing: $5.6k", "Won: $3.1k", "Follow-ups: 7"].map((x) => (
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

function ReadonlyResultsPreview({
  places,
  totalBeforeFilters,
}: {
  places: PlaceRow[];
  totalBeforeFilters: number;
}) {
  if (places.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
        No businesses match your filters.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Results ({places.length}
          {totalBeforeFilters > places.length ? ` of ${totalBeforeFilters}` : ""})
        </p>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          Preview
        </span>
      </div>

      <div className="space-y-3">
        {places.map((place) => (
          <div
            key={place.placeId}
            className="flex flex-col sm:flex-row gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-white">{place.name}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{place.address}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {place.rating != null && (
                  <span className="text-sm text-slate-500">
                    ★ {place.rating} ({place.reviewCount} reviews)
                  </span>
                )}
                {place.noWebsite && (
                  <span className="rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs px-2 py-0.5">
                    No website
                  </span>
                )}
                {place.hasSocialOnly && (
                  <span className="rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs px-2 py-0.5">
                    Social only
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <span className="text-sm text-indigo-600 dark:text-indigo-400">View on Maps</span>
              <span className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white font-medium opacity-80">
                Add to leads
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
