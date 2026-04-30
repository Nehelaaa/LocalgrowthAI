"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  isPro: boolean;
  atLeadCap: boolean;
  atSearchCap: boolean;
  /** From `getSearchUsageState` — Starter is `lifetime`, Pro is `daily` (overlay hidden for Pro). */
  searchQuotaMode: "lifetime" | "daily";
  leadsUsed: number;
  leadsLimit: number;
  searchesUsed: number;
  searchesLimit: number;
};

export function StarterLimitOverlay({
  isPro,
  atLeadCap,
  atSearchCap,
  searchQuotaMode,
  leadsUsed,
  leadsLimit,
  searchesUsed,
  searchesLimit,
}: Props) {
  const pathname = usePathname();

  if (isPro) return null;
  if (!atLeadCap && !atSearchCap) return null;

  // Allow access to the plan page so the user can upgrade.
  if (pathname?.startsWith("/dashboard/plan")) return null;

  const title = atLeadCap
    ? "You’ve reached your Starter lead limit"
    : "You’ve reached your Starter search limit";

  const searchScopeLabel = searchQuotaMode === "lifetime" ? "total" : "today";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 text-white shadow-2xl">
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-indigo-200/90">Upgrade required</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">Starter</span>
          </div>

          <div className="mt-4 space-y-3 text-sm text-slate-200/90">
            {atLeadCap ? (
              <p>
                You’ve used <span className="font-semibold text-white">{leadsUsed}</span> of{" "}
                <span className="font-semibold text-white">{leadsLimit}</span> lifetime lead slots. Deleting leads
                doesn’t restore slots.
              </p>
            ) : (
              <p>
                You’ve used <span className="font-semibold text-white">{searchesUsed}</span> of{" "}
                <span className="font-semibold text-white">{searchesLimit}</span> live Google searches{" "}
                {searchQuotaMode === "lifetime" ? "total — this quota does not reset." : "today."}
              </p>
            )}

            {atLeadCap && atSearchCap ? (
              <p>
                You’ve also hit your search limit ({searchesUsed}/{searchesLimit} {searchScopeLabel}).
              </p>
            ) : null}

            <p className="text-slate-300/90">Upgrade to Pro to unlock more searches and leads.</p>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href="/dashboard/plan"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              View plans
            </Link>
            {/* Force a real navigation (Next <Link> can no-op when already on /dashboard). */}
            <a
              href="/dashboard"
              onClick={(e) => {
                e.preventDefault();
                window.location.assign("/dashboard");
              }}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white/90 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/25"
            >
              Back to dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
