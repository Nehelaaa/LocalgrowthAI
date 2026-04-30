"use client";

import type { ReactNode } from "react";
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
    <fieldset className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
      <legend className="px-1 text-sm font-semibold text-slate-900 dark:text-white">{title}</legend>
      {hint ? (
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
      <div className="space-y-3">{children}</div>
    </fieldset>
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
      className="flex cursor-pointer items-start gap-2 rounded-lg py-1.5 text-sm text-slate-700 dark:text-slate-300"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span>{label}</span>
    </label>
  );
}

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

  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Refine results</h2>
          <p className="mt-1 max-w-xl text-xs text-slate-500 dark:text-slate-400">
            Filters combine: a business must match every section you use. Opportunity, value, and competition
            use simple rules from stars, review count, and the website Google shows—not a full audit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Showing {visibleCount}
            {totalCount > 0 ? ` of ${totalCount}` : ""}
          </span>
          <button
            type="button"
            onClick={() => onChange(defaultPlaceFilterState())}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Presets
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPresetClick("easy_wins")}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Easy Wins
          </button>
          <button
            type="button"
            onClick={() => applyPresetClick("high_value")}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            High Value
          </button>
          <button
            type="button"
            onClick={() => applyPresetClick("fast_closers")}
            className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
          >
            Fast Closers
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          <strong>Easy Wins</strong> — no real website, high opportunity, lower competition.{" "}
          <strong>High Value</strong> — established listings, sorted by value.{" "}
          <strong>Fast Closers</strong> — reachable by phone, lighter reviews, still strong opportunity.
        </p>
      </div>

      <div>
        <label htmlFor="place-sort" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Sort
        </label>
        <select
          id="place-sort"
          value={filters.sort}
          onChange={(e) =>
            patch({ sort: e.target.value as PlaceFilterState["sort"] })
          }
          className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          <option value="default">Default (search order)</option>
          <option value="opportunity">Highest opportunity first</option>
          <option value="value">Highest value first</option>
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="1. Business basics"
          hint={
            lastSearch
              ? `Search: ${lastSearch.businessType} near ${lastSearch.city}, ${lastSearch.state} · ${lastSearch.radiusMiles} mi radius. Change these in the form above.`
              : "Run a search first — city, radius, and business type come from the search form."
          }
        >
          <div>
            <label htmlFor="name-q" className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Name contains (optional)
            </label>
            <input
              id="name-q"
              type="text"
              value={filters.nameQuery}
              onChange={(e) => patch({ nameQuery: e.target.value })}
              placeholder="e.g. pizza, auto"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="min-rating" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Minimum rating
              </label>
              <select
                id="min-rating"
                value={filters.minRating ?? ""}
                onChange={(e) =>
                  patch({
                    minRating: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Any</option>
                <option value="3">3+ stars</option>
                <option value="3.5">3.5+ stars</option>
                <option value="4">4+ stars</option>
                <option value="4.5">4.5+ stars</option>
              </select>
            </div>
            <div>
              <label htmlFor="min-rev" className="text-xs font-medium text-slate-600 dark:text-slate-400">
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
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="max-rev" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Max reviews (optional)
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
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </Section>

        <Section
          title="2. Digital presence"
          hint="Instagram/Facebook: we only check whether those domains appear in the website URL Google returns."
        >
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Website</p>
          <div className="mt-2 flex flex-col gap-2">
            {(
              [
                ["any", "Any"],
                ["no", "No website (or social-only link)"],
                ["real", "Has a real website"],
              ] as const
            ).map(([v, label]) => (
              <label key={v} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="websiteMode"
                  checked={filters.websiteMode === v}
                  onChange={() => patch({ websiteMode: v })}
                  className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 dark:border-slate-600">
            {checkRow("ig", "No Instagram link in website URL", filters.requireNoInstagram, (c) =>
              patch({ requireNoInstagram: c })
            )}
            {checkRow("fb", "No Facebook link in website URL", filters.requireNoFacebook, (c) =>
              patch({ requireNoFacebook: c })
            )}
          </div>
        </Section>

        <Section title="3. Opportunity" hint="Pick one or more — match any selected tier.">
          {checkRow("opp-h", "High", filters.opportunityHigh, (c) => patch({ opportunityHigh: c }))}
          {checkRow("opp-m", "Medium", filters.opportunityMedium, (c) => patch({ opportunityMedium: c }))}
          {checkRow("opp-l", "Low", filters.opportunityLow, (c) => patch({ opportunityLow: c }))}
        </Section>

        <Section title="4. Value" hint="Pick one or more — match any selected tier.">
          {checkRow("val-h", "High-value business", filters.valueHigh, (c) => patch({ valueHigh: c }))}
          {checkRow("val-m", "Medium", filters.valueMedium, (c) => patch({ valueMedium: c }))}
          {checkRow("val-l", "Low", filters.valueLow, (c) => patch({ valueLow: c }))}
        </Section>

        <Section title="5. Competition" hint="Pick one or both — match any selected.">
          {checkRow("comp-l", "Low competition", filters.competitionLow, (c) => patch({ competitionLow: c }))}
          {checkRow("comp-h", "High competition", filters.competitionHigh, (c) => patch({ competitionHigh: c }))}
        </Section>

        <Section title="6. Activity" hint="If both are checked, a place must match both.">
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
        </Section>
      </div>

      {filters.requirePhone && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          “Fast closers” also requires a phone number on the listing.
        </p>
      )}

      {totalCount > 0 && visibleCount === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Nothing matches these filters. Try clearing a section or using a preset.
        </p>
      )}
    </div>
  );
}
