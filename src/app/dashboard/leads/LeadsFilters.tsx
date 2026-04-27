"use client";

import { ContactStatusPicker } from "@/components/ContactStatusPicker";
import { useRouter, useSearchParams } from "next/navigation";

export function LeadsFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(sp);
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/dashboard/leads?${next.toString()}`);
  };

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:p-4 dark:border-slate-800 bg-white dark:bg-slate-900 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
      <input
        type="search"
        placeholder="Search by name..."
        defaultValue={sp.get("search") ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const v = (e.target as HTMLInputElement).value.trim();
            set("search", v);
          }
        }}
        className="w-full min-w-0 min-h-[44px] touch-manipulation rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white sm:max-w-sm sm:min-w-[12rem]"
      />

      <div className="w-full min-w-0 sm:max-w-xs">
        <input
          type="text"
          list="lead-business-types"
          placeholder="Type (Auto, Salon, Dentist...)"
          defaultValue={sp.get("type") ?? ""}
          onChange={(e) => set("type", e.target.value)}
          className="w-full min-h-[44px] min-w-0 touch-manipulation rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white"
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
      </div>

      <div className="w-full min-w-0 sm:min-w-[14rem] sm:max-w-xs sm:flex-1">
        <ContactStatusPicker
          variant="filter"
          value={sp.get("status") ?? ""}
          onChange={(v) => set("status", v)}
        />
      </div>
      <select
        value={sp.get("badge") ?? ""}
        onChange={(e) => set("badge", e.target.value)}
        className="w-full min-h-[44px] min-w-0 touch-manipulation rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white sm:w-auto"
      >
        <option value="">All badges</option>
        <option value="HOT">HOT</option>
        <option value="WARM">WARM</option>
        <option value="COLD">COLD</option>
      </select>
      <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-slate-700 touch-manipulation dark:text-slate-300">
        <input
          type="checkbox"
          checked={sp.get("noWebsite") === "1"}
          onChange={(e) => set("noWebsite", e.target.checked ? "1" : "")}
          className="h-4 w-4 rounded border-slate-300"
        />
        No website only
      </label>
      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-3">
        <input
          type="number"
          placeholder="Min rating"
          min={0}
          max={5}
          step={0.5}
          defaultValue={sp.get("minRating") ?? ""}
          onChange={(e) => set("minRating", e.target.value)}
          className="w-full min-w-0 min-h-[44px] touch-manipulation rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white sm:w-24"
        />
        <input
          type="number"
          placeholder="Min reviews"
          min={0}
          defaultValue={sp.get("minReviews") ?? ""}
          onChange={(e) => set("minReviews", e.target.value)}
          className="w-full min-w-0 min-h-[44px] touch-manipulation rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white sm:w-28"
        />
      </div>
    </div>
  );
}
