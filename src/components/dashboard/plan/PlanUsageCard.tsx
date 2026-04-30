import { FREE_LEAD_LIMIT } from "@/lib/entitlements";

type Props = {
  isPro: boolean;
  leadsUsed: number;
  leadsRemaining: number;
  searchUsed: number;
  searchLimit: number;
  searchRemaining: number;
  showNearWarning: boolean;
  showHardWarning: boolean;
  nearLeadCap: boolean;
  nearSearchCap: boolean;
  atLeadCap: boolean;
  atSearchCap: boolean;
};

function Bar({
  pct,
  variant,
}: {
  pct: number;
  variant: "violet" | "amber" | "rose";
}) {
  const bg =
    variant === "rose"
      ? "bg-rose-500"
      : variant === "amber"
        ? "bg-amber-500"
        : "bg-violet-600";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div
        className={`h-full rounded-full transition-all ${bg}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

export function PlanUsageCard({
  isPro,
  leadsUsed,
  leadsRemaining,
  searchUsed,
  searchLimit,
  searchRemaining,
  showNearWarning,
  showHardWarning,
  nearLeadCap,
  nearSearchCap,
  atLeadCap,
  atSearchCap,
}: Props) {
  const leadPct = isPro ? 100 : (leadsUsed / FREE_LEAD_LIMIT) * 100;
  const searchPct = searchLimit > 0 ? (searchUsed / searchLimit) * 100 : 0;

  const leadBarVariant: "violet" | "amber" | "rose" =
    atLeadCap ? "rose" : nearLeadCap ? "amber" : "violet";
  const searchBarVariant: "violet" | "amber" | "rose" =
    searchRemaining === 0 && searchLimit > 0
      ? "rose"
      : nearSearchCap
        ? "amber"
        : "violet";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Usage</h3>
          {!isPro && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Starter limits — upgrade for unlimited leads and more searches.
            </p>
          )}
        </div>
        {!isPro && (
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">Lead slots left</p>
            <p className="text-2xl font-semibold tabular-nums leading-none text-slate-900 dark:text-white">
              {atLeadCap ? 0 : leadsRemaining}
            </p>
          </div>
        )}
        {isPro && (
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">Plan</p>
            <p className="text-lg font-semibold text-violet-600 dark:text-violet-400">Pro</p>
          </div>
        )}
      </div>

      {(showNearWarning || showHardWarning) && !isPro && (
        <div
          className={
            "mt-4 rounded-lg border px-3 py-2 text-xs font-medium " +
            (showHardWarning
              ? "border-rose-200/80 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100"
              : "border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100")
          }
        >
          {showHardWarning
            ? atLeadCap && atSearchCap
              ? "Lead and daily search limits reached — upgrade to continue."
              : atLeadCap
                ? "Lead limit reached — upgrade for unlimited leads."
                : "Daily search limit reached — upgrade for a higher quota."
            : "You’re close to a Starter limit — consider upgrading soon."}
          {showHardWarning && atLeadCap && (
            <p className="mt-1 text-[11px] font-medium opacity-90">
              Starter lead slots are lifetime total — deleting a lead doesn&apos;t restore a slot.
            </p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-1 flex-col gap-5">
        {!isPro && (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Lifetime leads</span>
              <span className="tabular-nums text-slate-500 dark:text-slate-400">
                {leadsUsed} / {FREE_LEAD_LIMIT}
              </span>
            </div>
            <Bar pct={leadPct} variant={leadBarVariant} />
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300">Discovery searches (today)</span>
            <span className="tabular-nums text-slate-500 dark:text-slate-400">
              {searchUsed} / {searchLimit}
            </span>
          </div>
          <Bar pct={searchPct} variant={isPro ? "violet" : searchBarVariant} />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
            {isPro
              ? `${searchRemaining} searches left today · resets at midnight UTC`
              : `${searchRemaining} left today · same search within 7 days uses cache`}
          </p>
        </div>
      </div>
    </div>
  );
}
