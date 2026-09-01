"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BusinessSearchForm } from "./BusinessSearchForm";
import { LeadSearchFiltersPanel, type LastSearchMeta } from "./LeadSearchFiltersPanel";
import { PlaceResults } from "./PlaceResults";
import {
  defaultPlaceFilterState,
  filterAndSortPlaces,
  type PlaceFilterState,
  type PlaceRow,
} from "@/lib/place-search-scoring";

type UsageInfo = {
  mode?: "lifetime" | "daily";
  used: number;
  limit: number;
  remaining: number;
  day: string | null;
};

type Props = {
  /** Territory captured during onboarding — prefills the form so the first search is one tap. */
  initialCity?: string;
  initialState?: string;
  initialBusinessType?: string;
};

export function SearchWorkspace({
  initialCity = "",
  initialState = "",
  initialBusinessType = "",
}: Props) {
  const [results, setResults] = useState<PlaceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [hiddenSavedCount, setHiddenSavedCount] = useState(0);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [lastSearch, setLastSearch] = useState<LastSearchMeta | null>(null);
  const [filters, setFilters] = useState<PlaceFilterState>(() => defaultPlaceFilterState());

  const refreshUsage = useCallback(() => {
    void fetch("/api/places/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: UsageInfo | null) => {
        if (d && "used" in d) setUsage(d);
      });
  }, []);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  const filteredPlaces = useMemo(
    () => filterAndSortPlaces(results, filters),
    [results, filters]
  );

  const onSearch = async (params: {
    city: string;
    state: string;
    radiusMiles: number;
    businessType: string;
  }) => {
    setLoading(true);
    setError(null);
    setFromCache(false);
    setHiddenSavedCount(0);
    try {
      const res = await fetch("/api/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = (await res.json()) as {
        error?: string;
        code?: string;
        places?: PlaceRow[];
        fromCache?: boolean;
        hiddenCount?: number;
        usage?: UsageInfo;
      };
      if (!res.ok) {
        if (res.status === 403 && data.code === "SEARCH_LIMIT" && data.usage) {
          setUsage(data.usage);
        }
        throw new Error(
          data.error === "Search limit reached" || data.error === "Daily search limit reached"
            ? "You’ve used all Starter live searches. Upgrade to Pro for a higher quota."
            : (data.error ?? "Search failed")
        );
      }
      setResults(data.places ?? []);
      setHiddenSavedCount(data.hiddenCount ?? 0);
      setLastSearch({
        city: params.city,
        state: params.state,
        radiusMiles: params.radiusMiles,
        businessType: params.businessType,
      });
      setFilters(defaultPlaceFilterState());
      setFromCache(!!data.fromCache);
      if (data.usage) {
        setUsage(data.usage);
      } else {
        refreshUsage();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromResults = useCallback((placeId: string) => {
    setResults((prev) => prev.filter((p) => p.placeId !== placeId));
  }, []);

  return (
    <div className="w-full min-w-0 max-w-4xl overflow-x-hidden">
      <h1 className="mb-2 text-xl font-bold text-slate-900 sm:mb-4 sm:text-2xl dark:text-white">
        Find businesses
      </h1>
      {usage && (
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Live Google searches{usage.mode === "lifetime" ? " (total)" : " (today)"}:{" "}
          <span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
            {usage.used} / {usage.limit}
          </span>{" "}
          used.
          {usage.mode === "lifetime"
            ? " Starter total does not reset."
            : " Resets daily at midnight UTC."}{" "}
          <Link href="/dashboard/plan" className="font-medium text-indigo-600 dark:text-indigo-400">
            Pro
          </Link>{" "}
          raises the cap.
        </p>
      )}
      <section className="w-full min-w-0 max-w-4xl rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-900/[0.02] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/60 dark:ring-white/[0.03] sm:p-6">
        <BusinessSearchForm
          onSearch={onSearch}
          loading={loading}
          embedded
          initialCity={initialCity}
          initialState={initialState}
          initialBusinessType={initialBusinessType}
        />
        {results.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800/80">
            <LeadSearchFiltersPanel
              lastSearch={lastSearch}
              filters={filters}
              onChange={setFilters}
              visibleCount={filteredPlaces.length}
              totalCount={results.length}
              embedded
            />
          </div>
        )}
      </section>
      {error && (
        <div className="mt-4 space-y-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-red-700 dark:text-red-300">
          <p>{error}</p>
        </div>
      )}
      {fromCache && results.length > 0 && (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Served from your recent cache — no new Google request.
        </p>
      )}
      {results.length === 0 && hiddenSavedCount > 0 && !loading && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
          Every business in this search is already in your CRM. Try a different city, radius, or business type.
        </div>
      )}
      {hiddenSavedCount > 0 && results.length > 0 && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          {hiddenSavedCount === 1
            ? "1 business already in your CRM was hidden from these results."
            : `${hiddenSavedCount} businesses already in your CRM were hidden from these results.`}
        </p>
      )}
      <PlaceResults
        places={filteredPlaces}
        totalBeforeFilters={results.length > 0 ? results.length : undefined}
        onPlaceAdded={removeFromResults}
      />
    </div>
  );
}
