"use client";

import { useState } from "react";
import { SearchableCityState } from "./SearchableCityState";

const RADII = [5, 10, 15, 25, 50];
const BUSINESS_TYPES = [
  "auto repair",
  "restaurant",
  "dentist",
  "contractor",
  "plumber",
  "hair salon",
  "lawyer",
  "accountant",
  "gym",
  "real estate agent",
  "bakery",
  "pizza",
  "roofer",
  "electrician",
  "landscaping",
];

type Props = {
  onSearch: (params: {
    city: string;
    state: string;
    radiusMiles: number;
    businessType: string;
  }) => Promise<void>;
  loading: boolean;
};

export function BusinessSearchForm({ onSearch, loading }: Props) {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [radiusMiles, setRadiusMiles] = useState(10);
  const [businessType, setBusinessType] = useState("auto repair");

  return (
    <form
      className="w-full min-w-0 max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch({ city, state, radiusMiles, businessType });
      }}
    >
      <SearchableCityState
        city={city}
        setCity={setCity}
        state={state}
        setState={setState}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Radius (miles)
          </label>
          <select
            value={radiusMiles}
            onChange={(e) => setRadiusMiles(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white"
          >
            {RADII.map((r) => (
              <option key={r} value={r}>
                {r} miles
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Business type
          </label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white"
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-[44px] touch-manipulation rounded-lg bg-indigo-600 px-6 py-2.5 text-center text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
