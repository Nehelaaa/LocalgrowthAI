"use client";

import { ContactStatusPicker } from "@/components/ContactStatusPicker";
import { useRouter, useSearchParams } from "next/navigation";

const shell =
  "rounded-xl border border-slate-200/90 bg-white/95 p-2 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700/80 dark:bg-slate-900/90 dark:ring-white/[0.05] sm:p-2.5";

const inp =
  "h-9 w-full min-w-0 touch-manipulation rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 shadow-inner shadow-slate-900/[0.03] placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-violet-500 sm:px-3";

/** One scrollable row on small screens; unwraps to a 12-col grid from `sm`. */
const stripScroll =
  "flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] sm:grid sm:snap-none sm:grid-cols-12 sm:gap-x-2 sm:gap-y-0 sm:overflow-visible sm:pb-0";

function FilterToolbar({
  sp,
  set,
}: {
  sp: ReturnType<typeof useSearchParams>;
  set: (key: string, value: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {/* Line 1 — full-width search */}
      <input
        type="search"
        enterKeyHint="search"
        placeholder="Search business name…"
        aria-label="Search by business name"
        defaultValue={sp.get("search") ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const v = (e.target as HTMLInputElement).value.trim();
            set("search", v);
          }
        }}
        className={inp}
      />

      {/* Line 2 — all other filters (scroll on narrow phones) */}
      <div className={stripScroll}>
        <input
          type="text"
          list="lead-business-types"
          placeholder="Business type…"
          aria-label="Business type filter"
          defaultValue={sp.get("type") ?? ""}
          onChange={(e) => set("type", e.target.value)}
          className={`${inp} w-[min(12rem,calc(100vw-4rem))] shrink-0 snap-start sm:col-span-3 sm:w-full`}
        />

        <div className="w-[min(17rem,calc(100vw-5rem))] shrink-0 snap-start sm:col-span-4 sm:w-full sm:min-w-0">
          <ContactStatusPicker
            compact
            variant="filter"
            value={sp.get("status") ?? ""}
            onChange={(v) => set("status", v)}
          />
        </div>

        <select
          value={sp.get("badge") ?? ""}
          onChange={(e) => set("badge", e.target.value)}
          aria-label="Lead badge"
          className={`${inp} w-[6.5rem] shrink-0 snap-start sm:col-span-2 sm:w-full`}
        >
          <option value="">All</option>
          <option value="HOT">HOT</option>
          <option value="WARM">WARM</option>
          <option value="COLD">COLD</option>
        </select>

        <label className="flex h-9 w-max shrink-0 snap-start cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/90 px-2.5 text-xs font-medium text-slate-700 touch-manipulation whitespace-nowrap dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200 sm:col-span-1 sm:px-2">
          <input
            type="checkbox"
            checked={sp.get("noWebsite") === "1"}
            onChange={(e) => set("noWebsite", e.target.checked ? "1" : "")}
            className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-500"
          />
          <span className="sm:hidden">No site</span>
          <span className="hidden sm:inline">No web</span>
        </label>

        <input
          type="number"
          placeholder="Min ★"
          aria-label="Minimum Google rating"
          title="Minimum rating (0–5)"
          min={0}
          max={5}
          step={0.5}
          defaultValue={sp.get("minRating") ?? ""}
          onChange={(e) => set("minRating", e.target.value)}
          className={`${inp} w-[4.25rem] shrink-0 snap-start tabular-nums sm:col-span-1 sm:w-full`}
        />
        <input
          type="number"
          placeholder="Reviews"
          aria-label="Minimum review count"
          title="Minimum number of reviews"
          min={0}
          defaultValue={sp.get("minReviews") ?? ""}
          onChange={(e) => set("minReviews", e.target.value)}
          className={`${inp} w-[4.5rem] shrink-0 snap-start tabular-nums sm:col-span-1 sm:w-full`}
        />
      </div>

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
  );
}

export function LeadsFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(sp);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page" && key !== "perPage") {
      next.delete("page");
    }
    router.push(`/dashboard/leads?${next.toString()}`);
  };

  return (
    <div className={`mb-3 md:mb-4 ${shell}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5 sm:px-0">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Filters
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          <span className="sm:hidden">Swipe row for more</span>
          <span className="hidden sm:inline">Enter in search to apply</span>
        </span>
      </div>
      <FilterToolbar sp={sp} set={set} />
    </div>
  );
}
