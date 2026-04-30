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
  used: number;
  limit: number;
  remaining: number;
  day: string;
};

export default function SearchPage() {
  const [results, setResults] = useState<PlaceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
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
        usage?: UsageInfo;
      };
      if (!res.ok) {
        if (res.status === 403 && data.code === "SEARCH_LIMIT" && data.usage) {
          setUsage(data.usage);
        }
        throw new Error(
          data.error === "Daily search limit reached"
            ? "You’ve reached today’s Starter search limit. Upgrade to Pro to keep searching, or try again tomorrow when the quota resets."
            : (data.error ?? "Search failed")
        );
      }
      setResults(data.places ?? []);
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

  return (
    <div className="w-full min-w-0 max-w-4xl">
      <h1 className="mb-2 text-xl font-bold text-slate-900 sm:mb-4 sm:text-2xl dark:text-white">
        Find businesses
      </h1>
      {usage && (
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Live Google searches today:{" "}
          <span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
            {usage.used} / {usage.limit}
          </span>{" "}
          used. Resets daily.{" "}
          <Link
            href="/dashboard"
            className="font-medium text-indigo-600 dark:text-indigo-400"
          >
            Pro
          </Link>{" "}
          raises the cap.
        </p>
      )}
      <BusinessSearchForm onSearch={onSearch} loading={loading} />
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
      {results.length > 0 && (
        <LeadSearchFiltersPanel
          lastSearch={lastSearch}
          filters={filters}
          onChange={setFilters}
          visibleCount={filteredPlaces.length}
          totalCount={results.length}
        />
      )}
      <PlaceResults
        places={filteredPlaces}
        totalBeforeFilters={results.length > 0 ? results.length : undefined}
      />
    </div>
  );
}
