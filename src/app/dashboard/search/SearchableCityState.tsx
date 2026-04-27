"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { filterStates, US_STATES } from "@/lib/us-states";

type CitySuggestion = {
  label: string;
  city: string;
  state: string;
  placeId: string;
};

type Props = {
  city: string;
  setCity: (v: string) => void;
  state: string;
  setState: (v: string) => void;
};

const DEBOUNCE_MS = 280;

export function SearchableCityState({ city, setCity, state, setState }: Props) {
  const [stateOpen, setStateOpen] = useState(false);
  const [stateFilter, setStateFilter] = useState(state);
  const [cityOpen, setCityOpen] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const cityAbortRef = useRef<AbortController | null>(null);
  const stateWrapRef = useRef<HTMLDivElement>(null);
  const cityWrapRef = useRef<HTMLDivElement>(null);
  const stateFilterRef = useRef(stateFilter);

  useEffect(() => {
    stateFilterRef.current = stateFilter;
  }, [stateFilter]);

  useEffect(() => {
    setStateFilter(state);
  }, [state]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (
        stateWrapRef.current &&
        !stateWrapRef.current.contains(e.target as Node)
      ) {
        setStateOpen(false);
      }
      if (
        cityWrapRef.current &&
        !cityWrapRef.current.contains(e.target as Node)
      ) {
        setCityOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const fetchCitySuggestions = useCallback(async (input: string) => {
    if (input.trim().length < 2) {
      setCitySuggestions([]);
      setCityLoading(false);
      return;
    }
    cityAbortRef.current?.abort();
    const ac = new AbortController();
    cityAbortRef.current = ac;
    setCityLoading(true);
    try {
      const res = await fetch("/api/places/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          stateHint: state?.trim() || undefined,
        }),
        signal: ac.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setCitySuggestions(data.suggestions ?? []);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setCitySuggestions([]);
      }
    } finally {
      setCityLoading(false);
    }
  }, [state]);

  useEffect(() => {
    if (!cityOpen) return;
    const t = window.setTimeout(() => {
      void fetchCitySuggestions(city);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [city, cityOpen, fetchCitySuggestions]);

  const filteredStates = filterStates(stateOpen ? stateFilter : "");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div ref={cityWrapRef} className="relative">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          City <span className="text-slate-400 font-normal">(search)</span>
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setCityOpen(true);
          }}
          onFocus={() => setCityOpen(true)}
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white"
          placeholder="e.g. Westborough"
          required
        />
        {cityOpen && (cityLoading || citySuggestions.length > 0) && (
          <ul
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 shadow-lg"
            role="listbox"
          >
            {cityLoading && city.trim().length >= 2 && (
              <li className="px-3 py-2 text-sm text-slate-500">Searching…</li>
            )}
            {citySuggestions.map((s) => (
              <li key={s.placeId}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setCity(s.city);
                    if (s.state) setState(s.state);
                    setCityOpen(false);
                    setCitySuggestions([]);
                  }}
                >
                  <span className="font-medium">{s.city}</span>
                  {s.state && (
                    <span className="text-slate-500">, {s.state}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div ref={stateWrapRef} className="relative">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          State <span className="text-slate-400 font-normal">(search)</span>
        </label>
        <input
          type="text"
          value={stateOpen ? stateFilter : state}
          onChange={(e) => {
            setStateFilter(e.target.value);
            setStateOpen(true);
          }}
          onFocus={() => {
            setStateOpen(true);
            setStateFilter(state);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              setStateOpen(false);
              const q = stateFilterRef.current.trim();
              const two = q.length === 2 ? q.toUpperCase() : "";
              if (two && US_STATES.some((s) => s.code === two)) {
                setState(two);
                setStateFilter(two);
                return;
              }
              const matches = filterStates(q);
              if (matches.length === 1) {
                setState(matches[0].code);
                setStateFilter(matches[0].code);
              }
            }, 200);
          }}
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white"
          placeholder="e.g. MA or Massachusetts"
          required
        />
        {stateOpen && (
          <ul
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 shadow-lg"
            role="listbox"
          >
            {filteredStates.map((s) => (
              <li key={s.code}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setState(s.code);
                    setStateFilter(s.code);
                    setStateOpen(false);
                  }}
                >
                  <span className="font-mono font-medium">{s.code}</span>
                  <span className="text-slate-500"> — {s.name}</span>
                </button>
              </li>
            ))}
            {filteredStates.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-500">No match</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
