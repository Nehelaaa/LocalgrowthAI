"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { saveBusinessAsLead } from "@/actions/leads";
import { FREE_LEAD_LIMIT } from "@/lib/entitlements";

/** Client-side list pagination (Google returns many rows after multi-page fetch). */
const RESULTS_PAGE_SIZE = 25;

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

function placeToPayload(place: Place) {
  return {
    placeId: place.placeId,
    name: place.name,
    address: place.address,
    city: place.city,
    state: place.state,
    phone: place.phone,
    website: place.website,
    rating: place.rating,
    reviewCount: place.reviewCount,
    googleMapsUrl: place.googleMapsUrl,
    businessType: place.businessType,
    hasSocialOnly: place.hasSocialOnly,
    noWebsite: place.noWebsite,
    photoUrl: place.photoUrl,
  };
}

export function PlaceResults({
  places,
  totalBeforeFilters,
}: {
  places: Place[];
  /** When refining, total raw results from search (for “X of Y”). */
  totalBeforeFilters?: number;
}) {
  const router = useRouter();
  const [uiPage, setUiPage] = useState(1);
  const [saving, setSaving] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(null), 4000);
  };

  const filtered = places;

  const totalUiPages = Math.max(1, Math.ceil(filtered.length / RESULTS_PAGE_SIZE));
  const safeUiPage = Math.min(uiPage, totalUiPages);
  const rangeStart = (safeUiPage - 1) * RESULTS_PAGE_SIZE;
  const visiblePage = filtered.slice(rangeStart, rangeStart + RESULTS_PAGE_SIZE);

  const placeKey = useMemo(
    () => places.map((p) => p.placeId).sort().join(","),
    [places]
  );

  useEffect(() => {
    setUiPage(1);
  }, [placeKey]);

  useEffect(() => {
    if (uiPage > totalUiPages) setUiPage(totalUiPages);
  }, [uiPage, totalUiPages]);

  const rawTotal = totalBeforeFilters ?? places.length;
  const showOfTotal = rawTotal > filtered.length;

  useEffect(() => {
    setSelected(new Set());
  }, [placeKey]);

  const allVisibleSelected =
    visiblePage.length > 0 && visiblePage.every((p) => selected.has(p.placeId));
  const someVisibleSelected = visiblePage.some((p) => selected.has(p.placeId));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        someVisibleSelected && !allVisibleSelected;
    }
  }, [someVisibleSelected, allVisibleSelected]);

  if (places.length === 0) {
    if (totalBeforeFilters && totalBeforeFilters > 0) {
      return (
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
          No businesses match your filters. Adjust refine options above or clear filters.
        </div>
      );
    }
    return null;
  }

  const toggle = (placeId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visiblePage.forEach((p) => next.delete(p.placeId));
      } else {
        visiblePage.forEach((p) => next.add(p.placeId));
      }
      return next;
    });
  };

  const handleAdd = async (place: Place) => {
    setSaving(place.placeId);
    const r = await saveBusinessAsLead(placeToPayload(place));
    if (!r.ok) {
      if (r.code === "LEAD_LIMIT") {
        window.alert(
          `You have used all ${FREE_LEAD_LIMIT} Free-plan lead slots (lifetime total). Deleting leads does not free slots. Upgrade to Pro in Plan & billing for unlimited leads.`
        );
      } else {
        window.alert(
          "This business is already a lead in the system (another account)."
        );
      }
      setSaving(null);
      return;
    }
    showFeedback(`"${place.name}" added to CRM.`);
    router.refresh();
    setSaving(null);
  };

  const handleBulkAdd = async () => {
    const toAdd = filtered.filter((p) => selected.has(p.placeId));
    if (toAdd.length === 0) return;
    setBulkSaving(true);
    try {
      let saved = 0;
      for (const place of toAdd) {
        const r = await saveBusinessAsLead(placeToPayload(place));
        if (!r.ok) {
          if (r.code === "LEAD_LIMIT") {
            window.alert(
              saved > 0
                ? `Added ${saved} lead(s), then hit the Free plan limit (${FREE_LEAD_LIMIT} lifetime slots). Upgrade to Pro for unlimited leads.`
                : `You have used all ${FREE_LEAD_LIMIT} Free-plan lead slots (lifetime). Upgrade to Pro for unlimited leads.`
            );
          } else {
            window.alert(
              `Skipped "${place.name}" — already another account's lead.`
            );
          }
          break;
        }
        saved += 1;
      }
      if (saved > 0) {
        setSelected(new Set());
        showFeedback(saved === 1 ? "1 lead added to CRM." : `${saved} leads added to CRM.`);
        router.refresh();
      }
    } finally {
      setBulkSaving(false);
    }
  };

  const selectedCount = filtered.filter((p) => selected.has(p.placeId)).length;
  const busy = saving !== null || bulkSaving;

  return (
    <div className="mt-8 space-y-4">
      {feedback ? (
        <p
          className="rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-100"
          role="status"
        >
          {feedback}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Results ({filtered.length}
            {showOfTotal ? ` of ${rawTotal}` : ""})
          </h2>
          {filtered.length > RESULTS_PAGE_SIZE ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">
                {rangeStart + 1}–{Math.min(rangeStart + RESULTS_PAGE_SIZE, filtered.length)}
              </span>{" "}
              of {filtered.length} · Page {safeUiPage} of {totalUiPages}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
              disabled={busy || visiblePage.length === 0}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Select all on this page
          </label>
          <button
            type="button"
            onClick={() => void handleBulkAdd()}
            disabled={busy || selectedCount === 0}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkSaving
              ? "Adding…"
              : `Add ${selectedCount} selected to leads`}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {visiblePage.map((place) => (
          <div
            key={place.placeId}
            className="flex flex-col sm:flex-row gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
          >
            <div className="flex items-start gap-3 sm:items-center">
              <input
                type="checkbox"
                checked={selected.has(place.placeId)}
                onChange={() => toggle(place.placeId)}
                disabled={busy}
                className="mt-1 sm:mt-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                aria-label={`Select ${place.name}`}
              />
              {place.photoUrl && (
                <Image
                  src={place.photoUrl}
                  alt=""
                  width={96}
                  height={96}
                  className="w-24 h-24 object-cover rounded-lg shrink-0"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {place.name}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {place.address}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {place.rating != null && (
                  <span className="text-sm text-slate-500">
                    ★ {place.rating} ({place.reviewCount} reviews)
                  </span>
                )}
                {place.noWebsite && (
                  <span className="rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs px-2 py-0.5">
                    No website
                  </span>
                )}
                {place.hasSocialOnly && (
                  <span className="rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs px-2 py-0.5">
                    Social only
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <a
                href={place.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View on Maps
              </a>
              <button
                type="button"
                onClick={() => void handleAdd(place)}
                disabled={busy}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {saving === place.placeId ? "Adding…" : "Add to leads"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalUiPages > 1 ? (
        <nav
          className="flex flex-col items-stretch gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
          aria-label="Results pages"
        >
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 sm:text-left">
            Page <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">{safeUiPage}</span> of{" "}
            <span className="tabular-nums">{totalUiPages}</span>
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setUiPage((p) => Math.max(1, p - 1))}
              disabled={busy || safeUiPage <= 1}
              className="min-h-10 min-w-[7rem] rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setUiPage((p) => Math.min(totalUiPages, p + 1))}
              disabled={busy || safeUiPage >= totalUiPages}
              className="min-h-10 min-w-[7rem] rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Next
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
