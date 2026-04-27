"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BusinessSearchForm } from "./BusinessSearchForm";
import { PlaceResults } from "./PlaceResults";

type Place = {
  placeId: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount: number;
  googleMapsUrl: string;
  businessType?: string;
  hasSocialOnly: boolean;
  noWebsite: boolean;
  photoUrl?: string;
};

type UsageInfo = {
  used: number;
  limit: number;
  remaining: number;
  day: string;
};

export default function SearchPage() {
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

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
        places?: Place[];
        fromCache?: boolean;
        usage?: UsageInfo;
      };
      if (!res.ok) {
        if (res.status === 403 && data.code === "SEARCH_LIMIT" && data.usage) {
          setUsage(data.usage);
        }
        throw new Error(
          data.error === "Daily search limit reached"
            ? "You’ve used today’s live Google search quota. Repeat the same search to load cached results, or upgrade to Pro for more API-backed searches per day."
            : (data.error ?? "Search failed")
        );
      }
      setResults(data.places ?? []);
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
          used. Cached repeats don&apos;t count.{" "}
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
          {error.includes("quota") && (
            <p className="text-sm opacity-90">
              Tip: run the exact same city, radius, and type again to hit the{" "}
              <span className="font-medium">7-day cache</span> and avoid another API
              call.
            </p>
          )}
        </div>
      )}
      {fromCache && results.length > 0 && (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Served from your recent cache — no new Google request.
        </p>
      )}
      {results.length > 0 && (
        <div className="mt-6 flex items-center gap-4">
          <label className="flex min-h-[44px] items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer touch-manipulation">
            <input
              type="checkbox"
              checked={noWebsiteOnly}
              onChange={(e) => setNoWebsiteOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Only show businesses with no website
          </label>
        </div>
      )}
      <PlaceResults places={results} noWebsiteOnly={noWebsiteOnly} />
    </div>
  );
}
