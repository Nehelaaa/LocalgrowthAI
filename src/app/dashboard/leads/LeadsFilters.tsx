"use client";

import { ContactStatusPicker } from "@/components/ContactStatusPicker";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function ChevronToggle({ open }: { open: boolean }) {
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

function FilterFields({
  sp,
  set,
}: {
  sp: ReturnType<typeof useSearchParams>;
  set: (key: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Search
        </span>
        <input
          type="search"
          placeholder="Business name…"
          defaultValue={sp.get("search") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = (e.target as HTMLInputElement).value.trim();
              set("search", v);
            }
          }}
          className="w-full min-h-[48px] touch-manipulation rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-inner shadow-slate-900/5 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-violet-500 dark:focus:ring-violet-400/20 md:text-sm"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block min-w-0 sm:col-span-2 lg:col-span-1">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Business type
          </span>
          <input
            type="text"
            list="lead-business-types"
            placeholder="Auto, salon, dentist…"
            defaultValue={sp.get("type") ?? ""}
            onChange={(e) => set("type", e.target.value)}
            className="w-full min-h-[48px] touch-manipulation rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-inner shadow-slate-900/5 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-slate-600 dark:bg-slate-800 dark:text-white md:text-sm"
          />
          <datalist id="lead-business-types">
            <option value="Auto" />
            <option value="Auto repair" />
            <option value="Auto body" />
            <option value="Salon" />
            <option value="Hair salon" />
            <option value="Barber" />
            <option value="Nail salon" />
            <option value="Dentist" />
            <option value="Chiropractor" />
            <option value="Plumber" />
            <option value="Electrician" />
            <option value="HVAC" />
            <option value="Roofing" />
            <option value="Landscaping" />
            <option value="Real estate" />
          </datalist>
        </label>

        <div className="min-w-0">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Contact status
          </span>
          <ContactStatusPicker variant="filter" value={sp.get("status") ?? ""} onChange={(v) => set("status", v)} />
        </div>

        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Lead badge
          </span>
          <select
            value={sp.get("badge") ?? ""}
            onChange={(e) => set("badge", e.target.value)}
            className="w-full min-h-[48px] touch-manipulation rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-inner shadow-slate-900/5 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-slate-600 dark:bg-slate-800 dark:text-white md:text-sm"
          >
            <option value="">All badges</option>
            <option value="HOT">HOT</option>
            <option value="WARM">WARM</option>
            <option value="COLD">COLD</option>
          </select>
        </label>
      </div>

      <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-violet-50/40 px-4 py-3 text-sm font-medium text-slate-700 touch-manipulation dark:border-slate-600 dark:bg-violet-950/15 dark:text-slate-200">
        <input
          type="checkbox"
          checked={sp.get("noWebsite") === "1"}
          onChange={(e) => set("noWebsite", e.target.checked ? "1" : "")}
          className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-500"
        />
        No website only
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Min rating
          </span>
          <input
            type="number"
            placeholder="0–5"
            min={0}
            max={5}
            step={0.5}
            defaultValue={sp.get("minRating") ?? ""}
            onChange={(e) => set("minRating", e.target.value)}
            className="w-full min-h-[48px] touch-manipulation rounded-xl border border-slate-200 bg-white px-4 py-3 text-base tabular-nums text-slate-900 shadow-inner shadow-slate-900/5 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-slate-600 dark:bg-slate-800 dark:text-white md:text-sm"
          />
        </label>
        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Min reviews
          </span>
          <input
            type="number"
            placeholder="0+"
            min={0}
            defaultValue={sp.get("minReviews") ?? ""}
            onChange={(e) => set("minReviews", e.target.value)}
            className="w-full min-h-[48px] touch-manipulation rounded-xl border border-slate-200 bg-white px-4 py-3 text-base tabular-nums text-slate-900 shadow-inner shadow-slate-900/5 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-slate-600 dark:bg-slate-800 dark:text-white md:text-sm"
          />
        </label>
      </div>
    </div>
  );
}

export function LeadsFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(sp);
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/dashboard/leads?${next.toString()}`);
  };

  const shellClass =
    "rounded-2xl border border-slate-200/90 bg-white/95 shadow-sm ring-1 ring-slate-900/[0.04] dark:border-slate-700/80 dark:bg-slate-900/90 dark:ring-white/[0.06]";

  return (
    <div className="mb-2 md:mb-6">
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          className={`flex w-full items-center justify-between gap-3 ${shellClass} px-4 py-3.5 text-left transition active:bg-slate-50 dark:active:bg-slate-800/80`}
        >
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">Search &amp; filters</span>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {filtersOpen ? "Tap to hide" : "Tap to show filters"}
            </p>
          </div>
          <ChevronToggle open={filtersOpen} />
        </button>
        {filtersOpen ? (
          <div className={`mt-2 ${shellClass} p-4`}>
            <FilterFields sp={sp} set={set} />
          </div>
        ) : null}
      </div>

      <div className={`hidden md:block ${shellClass} p-4 lg:p-5`}>
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Filters</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Refine your pipeline</span>
        </div>
        <FilterFields sp={sp} set={set} />
      </div>
    </div>
  );
}
