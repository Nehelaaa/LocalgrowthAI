"use client";

import { useMemo, useRef, useState } from "react";
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
  /** When true, render without the outer card — parent provides container. */
  embedded?: boolean;
  /** Optional prefill (used for marketing previews). */
  initialCity?: string;
  /** Optional prefill (used for marketing previews). */
  initialState?: string;
  /** Optional prefill (used for marketing previews). */
  initialRadiusMiles?: number;
  /** Optional prefill (used for marketing previews). */
  initialBusinessType?: string;
  /** Optional id on the submit control (marketing pointer / tests). */
  submitButtonId?: string;
};

export function BusinessSearchForm({
  onSearch,
  loading,
  embedded,
  initialCity = "",
  initialState = "",
  initialRadiusMiles = 10,
  initialBusinessType = "",
  submitButtonId,
}: Props) {
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const [radiusMiles, setRadiusMiles] = useState(initialRadiusMiles);
  const [businessType, setBusinessType] = useState(initialBusinessType);
  const [bizTypeOpen, setBizTypeOpen] = useState(false);
  const [bizTypeActiveIndex, setBizTypeActiveIndex] = useState<number>(-1);
  const blurCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bizTypeSuggestions = useMemo(() => {
    const q = businessType.trim().toLowerCase();
    if (!q) return BUSINESS_TYPES;
    return BUSINESS_TYPES.filter((t) => t.toLowerCase().includes(q));
  }, [businessType]);

  const commitBusinessType = (value: string) => {
    setBusinessType(value);
    setBizTypeOpen(false);
    setBizTypeActiveIndex(-1);
  };

  return (
    <form
      className={
        embedded
          ? "w-full min-w-0 max-w-2xl space-y-4"
          : "w-full min-w-0 max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      }
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
          <div className="relative">
            <input
              value={businessType}
              onChange={(e) => {
                setBusinessType(e.target.value);
                setBizTypeOpen(true);
                setBizTypeActiveIndex(-1);
              }}
              onFocus={() => {
                if (blurCloseTimer.current) clearTimeout(blurCloseTimer.current);
                setBizTypeOpen(true);
              }}
              onBlur={() => {
                blurCloseTimer.current = setTimeout(() => setBizTypeOpen(false), 120);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setBizTypeOpen(false);
                  setBizTypeActiveIndex(-1);
                  return;
                }
                if (!bizTypeOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                  setBizTypeOpen(true);
                }
                if (!bizTypeOpen) return;

                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setBizTypeActiveIndex((i) =>
                    Math.min(i + 1, Math.max(0, bizTypeSuggestions.length - 1)),
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setBizTypeActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter") {
                  if (bizTypeActiveIndex >= 0 && bizTypeSuggestions[bizTypeActiveIndex]) {
                    e.preventDefault();
                    commitBusinessType(bizTypeSuggestions[bizTypeActiveIndex]);
                  }
                }
              }}
              autoComplete="off"
              placeholder="e.g. med spa, HVAC, locksmith..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white"
              role="combobox"
              aria-expanded={bizTypeOpen}
              aria-controls="business-type-suggestions"
              aria-autocomplete="list"
            />
            {bizTypeOpen && bizTypeSuggestions.length > 0 ? (
              <div
                id="business-type-suggestions"
                role="listbox"
                className="absolute left-0 right-0 z-20 mt-2 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
              >
                {bizTypeSuggestions.map((t, idx) => {
                  const active = idx === bizTypeActiveIndex;
                  return (
                    <button
                      key={t}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={
                        "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm " +
                        (active
                          ? "bg-indigo-50 text-slate-900 dark:bg-slate-800 dark:text-white"
                          : "text-slate-900 hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800/80")
                      }
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => commitBusinessType(t)}
                      onMouseEnter={() => setBizTypeActiveIndex(idx)}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Start typing to search any business type, or pick from suggestions.
          </p>
        </div>
      </div>

      <button
        id={submitButtonId}
        type="submit"
        disabled={loading}
        className="w-full min-h-[44px] touch-manipulation rounded-lg bg-indigo-600 px-6 py-2.5 text-center text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
