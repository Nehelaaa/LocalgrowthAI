import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";
import { getUtcDayString } from "@/lib/search-usage";

function usd(amount: number) {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export default async function OwnerCostsPage() {
  await requireOwnerOrRedirect();
  const day = getUtcDayString();

  const googleCostPerSearch =
    Number(process.env.GOOGLE_COST_PER_SEARCH_USD ?? "0.017") || 0.017;
  const aiCostPerCall =
    Number(process.env.AI_COST_PER_CALL_USD ?? "0.02") || 0.02;

  const [searches, aiCalls] = await Promise.all([
    prisma.searchDayUsage.aggregate({ where: { day }, _sum: { count: true } }),
    prisma.aiDayUsage.aggregate({ where: { day }, _sum: { count: true } }),
  ]);

  const searchCount = searches._sum.count ?? 0;
  const aiCount = aiCalls._sum.count ?? 0;

  const googleCost = searchCount * googleCostPerSearch;
  const aiCost = aiCount * aiCostPerCall;

  return (
    <div className="w-full min-w-0 max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          API cost monitoring (estimated)
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Estimates use env vars <code>GOOGLE_COST_PER_SEARCH_USD</code> and{" "}
          <code>AI_COST_PER_CALL_USD</code>. (Default: $0.017/search, $0.02/AI call)
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Google Maps / Places (today)
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {usd(googleCost)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {searchCount} searches × {googleCostPerSearch}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            AI usage (today)
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {usd(aiCost)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {aiCount} calls × {aiCostPerCall}
          </p>
        </div>
      </div>
    </div>
  );
}

