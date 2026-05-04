"use client";

import type { ReactNode } from "react";
import { useState } from "react";
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
  "mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

type FilterTabId = "basics" | "web" | "fit";

function FilterBlock({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        {hint ? (
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">{hint}</p>
        ) : null}
      </div>
      {children}
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
        "flex min-h-[32px] cursor-pointer touch-manipulation items-center justify-center rounded-md border px-1.5 py-1 text-center text-[11px] font-medium transition sm:min-h-[34px] sm:px-2 sm:text-xs " +
        (checked
          ? "border-violet-500 bg-violet-50 text-violet-900 shadow-sm dark:border-violet-400/50 dark:bg-violet-950/35 dark:text-violet-100"
          : "border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500")
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
  ["any", "Any — website filter off", "Any"],
  ["no", "No real website (social-only counts as no site)", "No site"],
  ["real", "Has a real website on the listing", "Has site"],
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

  const [tab, setTab] = useState<FilterTabId>("basics");

  const basicsHint =
    lastSearch != null
      ? `${lastSearch.businessType} · ${lastSearch.city}, ${lastSearch.state} · ${lastSearch.radiusMiles} mi`
      : "Location and business type come from the search form above.";

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
          {WEBSITE_MODES.map(([v, tip, short]) => (
            <button
              key={v}
              type="button"
              onClick={() => patch({ websiteMode: v })}
              title={tip}
              className={
                "min-h-[32px] rounded-md px-1 py-1.5 text-center text-[10px] font-semibold leading-tight transition sm:min-h-[34px] sm:text-[11px] " +
                (filters.websiteMode === v
                  ? "bg-white text-violet-700 shadow-sm dark:bg-slate-900 dark:text-violet-300"
                  : "text-slate-600 dark:text-slate-400")
              }
            >
              {short}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1 border-t border-slate-100 pt-2 dark:border-slate-700/80">
        {checkRow("ig", "No instagram.com in listing URL", filters.requireNoInstagram, (c) =>
          patch({ requireNoInstagram: c })
        )}
        {checkRow("fb", "No facebook.com in listing URL", filters.requireNoFacebook, (c) =>
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
        "Quiet listing (≤5 reviews)",
        filters.activityNoRecentReviews,
        (c) => patch({ activityNoRecentReviews: c })
      )}
      {checkRow(
        "act-e",
        "Low engagement (<22 reviews)",
        filters.activityLowEngagement,
        (c) => patch({ activityLowEngagement: c })
      )}
    </>
  );

  const tabBtn = (id: FilterTabId, label: string) => {
    const on = tab === id;
    return (
      <button
        key={id}
        type="button"
        id={`filter-tab-${id}`}
        role="tab"
        aria-selected={on}
        aria-controls="filter-panel"
        onClick={() => setTab(id)}
        className={
          "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition " +
          (on
            ? "bg-violet-600 text-white shadow-sm dark:bg-violet-500"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")
        }
      >
        {label}
      </button>
    );
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/90 sm:mt-4 sm:p-3.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Refine results</h2>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Active filters combine (AND). Hover preset buttons for details.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-900 dark:bg-violet-950/50 dark:text-violet-200">
            {visibleCount}
            {totalCount > 0 ? ` / ${totalCount}` : ""} shown
          </span>
          <button
            type="button"
            onClick={() => onChange(defaultPlaceFilterState())}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Presets
        </span>
        <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => applyPresetClick("easy_wins")}
          title="No real website, higher opportunity, lower competition."
          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-500 active:scale-[0.99]"
        >
          Easy Wins
        </button>
        <button
          type="button"
          onClick={() => applyPresetClick("high_value")}
          title="Established listings — strong reviews and presence."
          className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.99]"
        >
          High Value
        </button>
        <button
          type="button"
          onClick={() => applyPresetClick("fast_closers")}
          title="Phone on listing, lighter reviews, strong opportunity."
          className="rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-violet-500 active:scale-[0.99]"
        >
          Fast Closers
        </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filter categories"
          className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {tabBtn("basics", "Basics")}
          {tabBtn("web", "Web & social")}
          {tabBtn("fit", "Fit & activity")}
        </div>
        <div className="w-full shrink-0 sm:w-48 sm:min-w-[11rem]">
          <label htmlFor="place-sort" className="sr-only">
            Sort results
          </label>
          <select
            id="place-sort"
            value={filters.sort}
            onChange={(e) => patch({ sort: e.target.value as PlaceFilterState["sort"] })}
            className={inputClass}
          >
            <option value="default">Sort: default</option>
            <option value="opportunity">Sort: opportunity</option>
            <option value="value">Sort: value</option>
          </select>
        </div>
      </div>

      <div
        id="filter-panel"
        className="mt-3 rounded-lg bg-slate-50/60 p-3 dark:bg-slate-800/30"
        role="tabpanel"
        aria-labelledby={`filter-tab-${tab}`}
      >
        {tab === "basics" && (
          <div className="space-y-3">
            <FilterBlock title="Business" hint={basicsHint}>
              {basicsContent}
            </FilterBlock>
          </div>
        )}
        {tab === "web" && (
          <FilterBlock
            title="Listing URL"
            hint="We only inspect the website URL Google shows for the business."
          >
            {digitalContent}
          </FilterBlock>
        )}
        {tab === "fit" && (
          <div className="space-y-4">
            <FilterBlock title="Opportunity">
              {opportunityContent}
            </FilterBlock>
            <FilterBlock title="Value">
              {valueContent}
            </FilterBlock>
            <FilterBlock title="Competition">
              {competitionContent}
            </FilterBlock>
            <div className="border-t border-slate-200/80 pt-3 dark:border-slate-600/80">
              <FilterBlock title="Activity" hint="Optional — narrows to quieter listings.">
                {activityContent}
              </FilterBlock>
            </div>
          </div>
        )}
      </div>

      {filters.requirePhone && (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          Fast Closers preset expects a phone number on the listing.
        </p>
      )}

      {totalCount > 0 && visibleCount === 0 && (
        <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100">
          No matches — loosen filters or try a preset.
        </p>
      )}
    </div>
  );
}
