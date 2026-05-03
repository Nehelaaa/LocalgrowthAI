"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useState } from "react";
import type { PlaceFilterState, PresetId } from "@/lib/place-search-scoring";
import {
  applyPreset,
  defaultPlaceFilterState,
} from "@/lib/place-search-scoring";

export type LastSearchMeta = {
  city: string;
  state: string;
  radiusMiles: number;
  businessType: string;
};

type Props = {
  lastSearch: LastSearchMeta | null;
  filters: PlaceFilterState;
  onChange: (next: PlaceFilterState) => void;
  visibleCount: number;
  totalCount: number;
};

const inputClass =
  "w-full min-h-[40px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-900/5 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-slate-600 dark:bg-slate-800 dark:text-white md:min-h-[38px]";

const labelClass =
  "mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-xl border border-slate-200/75 bg-slate-50/35 p-3 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700/80 dark:bg-slate-800/25 dark:ring-white/[0.04] lg:p-3.5">
      <legend className="px-0.5 text-xs font-semibold text-slate-800 dark:text-slate-100">{title}</legend>
      {hint ? (
        <p className="mb-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
      <div className="space-y-2">{children}</div>
    </fieldset>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function MobileAccordionSection({
  id,
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700/80 dark:bg-slate-900/90 dark:ring-white/[0.05]">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition active:bg-slate-50 dark:active:bg-slate-800/60"
      >
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
        <Chevron open={open} />
      </button>
      {open ? (
        <div className="space-y-2 border-t border-slate-100 px-3 py-3 dark:border-slate-800">
          {hint ? (
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{hint}</p>
          ) : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}

function ToggleChip({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={
        "flex min-h-[36px] cursor-pointer touch-manipulation items-center justify-center rounded-lg border px-2 py-1.5 text-center text-xs font-medium transition " +
        (checked
          ? "border-violet-500 bg-violet-50 text-violet-900 shadow-sm dark:border-violet-400/50 dark:bg-violet-950/35 dark:text-violet-100"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500")
      }
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {label}
    </label>
  );
}

function checkRow(
  id: string,
  label: string,
  checked: boolean,
  onChange: (checked: boolean) => void
) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent py-0.5 text-xs text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-500"
      />
      <span className="leading-snug">{label}</span>
    </label>
  );
}

const WEBSITE_MODES = [
  ["any", "Any", "Any"],
  ["no", "No website (or social-only link)", "No site"],
  ["real", "Has a real website", "Has site"],
] as const;

export function LeadSearchFiltersPanel({
  lastSearch,
  filters,
  onChange,
  visibleCount,
  totalCount,
}: Props) {
  const patch = (p: Partial<PlaceFilterState>) => onChange({ ...filters, ...p });

  const applyPresetClick = (id: PresetId) => {
    onChange(applyPreset(id));
  };

  const [desktop, setDesktop] = useState(true);
  const [mobileOpenId, setMobileOpenId] = useState<string>("1-basics");

  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const toggleMobileSection = (id: string) => {
    setMobileOpenId((cur) => (cur === id ? "" : id));
  };

  const basicsHint =
    lastSearch != null
      ? `Search: ${lastSearch.businessType} near ${lastSearch.city}, ${lastSearch.state} · ${lastSearch.radiusMiles} mi radius. Change these in the form above.`
      : "Run a search first — city, radius, and business type come from the search form.";

  const basicsContent = (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <div className="sm:col-span-2 xl:col-span-1">
        <label htmlFor="name-q" className={labelClass}>
          Name contains (optional)
        </label>
        <input
          id="name-q"
          type="text"
          value={filters.nameQuery}
          onChange={(e) => patch({ nameQuery: e.target.value })}
          placeholder="e.g. pizza, auto"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="min-rating" className={labelClass}>
          Min rating
        </label>
        <select
          id="min-rating"
          value={filters.minRating ?? ""}
          onChange={(e) =>
            patch({
              minRating: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className={inputClass}
        >
          <option value="">Any</option>
          <option value="3">3+ stars</option>
          <option value="3.5">3.5+ stars</option>
          <option value="4">4+ stars</option>
          <option value="4.5">4.5+ stars</option>
        </select>
      </div>
      <div>
        <label htmlFor="min-rev" className={labelClass}>
          Min reviews
        </label>
        <input
          id="min-rev"
          type="number"
          min={0}
          inputMode="numeric"
          value={filters.minReviews ?? ""}
          onChange={(e) =>
            patch({
              minReviews: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          placeholder="Any"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="max-rev" className={labelClass}>
          Max reviews
        </label>
        <input
          id="max-rev"
          type="number"
          min={0}
          inputMode="numeric"
          value={filters.maxReviews ?? ""}
          onChange={(e) =>
            patch({
              maxReviews: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          placeholder="No max"
          className={inputClass}
        />
      </div>
    </div>
  );

  const digitalContent = (
    <>
      <div>
        <p className={labelClass}>Website</p>
        <div className="mt-1 grid grid-cols-3 gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800/80">
          {WEBSITE_MODES.map(([v, full, short]) => (
            <button
              key={v}
              type="button"
              onClick={() => patch({ websiteMode: v })}
              className={
                "min-h-[36px] rounded-md px-1 py-1.5 text-center text-[10px] font-semibold leading-tight transition sm:text-[11px] " +
                (filters.websiteMode === v
                  ? "bg-white text-violet-700 shadow-sm dark:bg-slate-900 dark:text-violet-300"
                  : "text-slate-600 dark:text-slate-400")
              }
              title={full}
            >
              <span className="lg:hidden">{short}</span>
              <span className="hidden lg:inline">{full}</span>
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[10px] leading-snug text-slate-500 lg:hidden dark:text-slate-400">
          Long-press or hover for full label.
        </p>
      </div>
      <div className="space-y-1.5 border-t border-slate-200 pt-2 dark:border-slate-600">
        {checkRow("ig", "No Instagram link in website URL", filters.requireNoInstagram, (c) =>
          patch({ requireNoInstagram: c })
        )}
        {checkRow("fb", "No Facebook link in website URL", filters.requireNoFacebook, (c) =>
          patch({ requireNoFacebook: c })
        )}
      </div>
    </>
  );

  const opportunityContent = (
    <div className="grid grid-cols-3 gap-2">
      <ToggleChip
        id="opp-h"
        label="High"
        checked={filters.opportunityHigh}
        onChange={(c) => patch({ opportunityHigh: c })}
      />
      <ToggleChip
        id="opp-m"
        label="Medium"
        checked={filters.opportunityMedium}
        onChange={(c) => patch({ opportunityMedium: c })}
      />
      <ToggleChip
        id="opp-l"
        label="Low"
        checked={filters.opportunityLow}
        onChange={(c) => patch({ opportunityLow: c })}
      />
    </div>
  );

  const valueContent = (
    <div className="grid grid-cols-3 gap-2">
      <ToggleChip
        id="val-h"
        label="High value"
        checked={filters.valueHigh}
        onChange={(c) => patch({ valueHigh: c })}
      />
      <ToggleChip
        id="val-m"
        label="Medium"
        checked={filters.valueMedium}
        onChange={(c) => patch({ valueMedium: c })}
      />
      <ToggleChip
        id="val-l"
        label="Low"
        checked={filters.valueLow}
        onChange={(c) => patch({ valueLow: c })}
      />
    </div>
  );

  const competitionContent = (
    <div className="grid grid-cols-2 gap-2">
      <ToggleChip
        id="comp-l"
        label="Low competition"
        checked={filters.competitionLow}
        onChange={(c) => patch({ competitionLow: c })}
      />
      <ToggleChip
        id="comp-h"
        label="High competition"
        checked={filters.competitionHigh}
        onChange={(c) => patch({ competitionHigh: c })}
      />
    </div>
  );

  const activityContent = (
    <>
      {checkRow(
        "act-r",
        "No recent reviews (≤5 reviews — quiet listing)",
        filters.activityNoRecentReviews,
        (c) => patch({ activityNoRecentReviews: c })
      )}
      {checkRow(
        "act-e",
        "Low engagement (under 22 reviews)",
        filters.activityLowEngagement,
        (c) => patch({ activityLowEngagement: c })
      )}
    </>
  );

  const wrap = (id: string, title: string, hint: string | undefined, body: ReactNode) => {
    if (desktop) {
      return (
        <Section title={title} hint={hint}>
          {body}
        </Section>
      );
    }
    return (
      <MobileAccordionSection
        id={id}
        title={title}
        hint={hint}
        open={mobileOpenId === id}
        onToggle={toggleMobileSection}
      >
        {body}
      </MobileAccordionSection>
    );
  };

  return (
    <div className="mt-3 space-y-2.5 rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-sm ring-1 ring-slate-900/[0.04] dark:border-slate-800/90 dark:bg-slate-900/90 dark:ring-white/[0.06] sm:mt-4 sm:space-y-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-sm sm:font-semibold">
            Refine results
          </h2>
          <p className="mt-0.5 hidden text-[11px] leading-snug text-slate-500 dark:text-slate-400 md:block">
            Filters stack: a place must match every section you use. Rules use stars, reviews, and the URL Google
            shows.
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 md:hidden">
            Tap a section to edit. Try presets for quick setups.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-900 dark:bg-violet-950/50 dark:text-violet-200">
            Showing {visibleCount}
            {totalCount > 0 ? ` / ${totalCount}` : ""}
          </span>
          <button
            type="button"
            onClick={() => onChange(defaultPlaceFilterState())}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
        <div className="min-w-0 flex-1">
          <p className={labelClass}>Presets</p>
          <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => applyPresetClick("easy_wins")}
              className="shrink-0 snap-start rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-500 active:scale-[0.99]"
            >
              Easy Wins
            </button>
            <button
              type="button"
              onClick={() => applyPresetClick("high_value")}
              className="shrink-0 snap-start rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.99]"
            >
              High Value
            </button>
            <button
              type="button"
              onClick={() => applyPresetClick("fast_closers")}
              className="shrink-0 snap-start rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-violet-500 active:scale-[0.99]"
            >
              Fast Closers
            </button>
          </div>
          <p className="mt-1.5 hidden text-[11px] leading-snug text-slate-500 md:block dark:text-slate-400">
            <strong className="text-slate-700 dark:text-slate-300">Easy Wins</strong> — no real website, high
            opportunity, lower competition. <strong className="text-slate-700 dark:text-slate-300">High Value</strong> —
            established listings. <strong className="text-slate-700 dark:text-slate-300">Fast Closers</strong> — phone,
            lighter reviews, strong opportunity.
          </p>
          <details className="mt-1.5 md:hidden">
            <summary className="cursor-pointer text-[11px] font-medium text-violet-700 dark:text-violet-300">
              What do presets do?
            </summary>
            <p className="mt-1.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
              <strong>Easy Wins</strong> — no real website, high opportunity. <strong>High Value</strong> — established
              listings. <strong>Fast Closers</strong> — phone, lighter reviews.
            </p>
          </details>
        </div>
        <div className="w-full shrink-0 lg:w-52">
          <label htmlFor="place-sort" className={labelClass}>
            Sort
          </label>
          <select
            id="place-sort"
            value={filters.sort}
            onChange={(e) => patch({ sort: e.target.value as PlaceFilterState["sort"] })}
            className={`${inputClass} mt-1`}
          >
            <option value="default">Default (search order)</option>
            <option value="opportunity">Highest opportunity first</option>
            <option value="value">Highest value first</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-2 lg:gap-3">
        {wrap("1-basics", "1. Business basics", basicsHint, basicsContent)}
        {wrap(
          "2-digital",
          "2. Digital presence",
          "Instagram/Facebook: we only check whether those domains appear in the website URL Google returns.",
          digitalContent
        )}
        {wrap(
          "3-opportunity",
          "3. Opportunity",
          "Pick one or more — match any selected tier.",
          opportunityContent
        )}
        {wrap("4-value", "4. Value", "Pick one or more — match any selected tier.", valueContent)}
        {wrap("5-competition", "5. Competition", "Pick one or both — match any selected.", competitionContent)}
        {wrap("6-activity", "6. Activity", "If both are checked, a place must match both.", activityContent)}
      </div>

      {filters.requirePhone && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          “Fast closers” also requires a phone number on the listing.
        </p>
      )}

      {totalCount > 0 && visibleCount === 0 && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          Nothing matches these filters. Try clearing a section or using a preset.
        </p>
      )}
    </div>
  );
}
