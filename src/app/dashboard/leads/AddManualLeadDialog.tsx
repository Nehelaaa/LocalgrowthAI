"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveManualCrmLeadForPipeline } from "@/actions/leads";

export function AddManualLeadDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const r = await saveManualCrmLeadForPipeline({
        businessName: String(fd.get("businessName") ?? ""),
        phone: String(fd.get("phone") ?? "").trim() || undefined,
        website: String(fd.get("website") ?? "").trim() || undefined,
        address: String(fd.get("address") ?? "").trim() || undefined,
        city: String(fd.get("city") ?? "").trim() || undefined,
        state: String(fd.get("state") ?? "").trim() || undefined,
        businessTypeLabel:
          String(fd.get("businessType") ?? "").trim() || "Manual entry",
        notesLine: String(fd.get("notes") ?? "").trim() || undefined,
      });
      if (r.ok) {
        setOpen(false);
        e.currentTarget.reset();
        router.refresh();
        return;
      }
      if (r.code === "LEAD_LIMIT") {
        window.alert(
          "You've used all Free-plan lead slots (lifetime total). Upgrade to Pro for unlimited leads."
        );
        return;
      }
      window.alert("Enter a business or contact name.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500"
      >
        Add lead
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-[1px] sm:items-center sm:p-6"
          role="presentation"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal
            aria-labelledby="manual-lead-title"
            className="max-h-[min(90dvh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2 id="manual-lead-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                Add lead (not from Google)
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create a prospect that isn&apos;t in Google search results—referrals, walk-ins, or your own
                list.
              </p>
            </div>

            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 px-5 py-4">
              <div>
                <label htmlFor="manual-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Business name <span className="text-red-600">*</span>
                </label>
                <input
                  ref={firstFieldRef}
                  id="manual-name"
                  name="businessName"
                  required
                  autoComplete="organization"
                  placeholder="e.g. Main St. Bakery"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="manual-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Phone
                  </label>
                  <input
                    id="manual-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Optional"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="manual-website" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Website
                  </label>
                  <input
                    id="manual-website"
                    name="website"
                    type="url"
                    inputMode="url"
                    placeholder="https://…"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="manual-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Type / category
                </label>
                <input
                  id="manual-type"
                  name="businessType"
                  placeholder="e.g. Plumber, Restaurant"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="manual-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Street address
                </label>
                <input
                  id="manual-address"
                  name="address"
                  autoComplete="street-address"
                  placeholder="Optional"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="manual-city" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    City
                  </label>
                  <input
                    id="manual-city"
                    name="city"
                    autoComplete="address-level2"
                    placeholder="Optional"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="manual-state" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    State
                  </label>
                  <input
                    id="manual-state"
                    name="state"
                    autoComplete="address-level1"
                    placeholder="e.g. MA"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="manual-notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Notes
                </label>
                <textarea
                  id="manual-notes"
                  name="notes"
                  rows={3}
                  placeholder="How you found them, next step…"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[44px] rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? "Saving…" : "Save lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
