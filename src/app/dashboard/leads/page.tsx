import { getLeads } from "@/actions/leads-list";
import { AddManualLeadDialog } from "./AddManualLeadDialog";
import { LeadsTable } from "./LeadsTable";
import { LeadsFilters } from "./LeadsFilters";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const businessType =
    typeof params.type === "string" && params.type ? params.type : undefined;
  const contactStatus =
    typeof params.status === "string" && params.status
      ? (params.status as "NOT_CONTACTED" | "CONTACTED" | "INTERESTED" | "CLOSED_WON" | "CLOSED_LOST")
      : undefined;
  const badge =
    typeof params.badge === "string" && params.badge
      ? (params.badge as "HOT" | "WARM" | "COLD")
      : undefined;
  const minRating =
    typeof params.minRating === "string" ? Number(params.minRating) : undefined;
  const minReviews =
    typeof params.minReviews === "string" ? Number(params.minReviews) : undefined;
  const noWebsiteOnly = params.noWebsite === "1";

  const leads = await getLeads({
    search,
    businessType,
    contactStatus,
    badge,
    minRating: Number.isFinite(minRating) ? minRating : undefined,
    minReviews: Number.isFinite(minReviews) ? minReviews : undefined,
    noWebsiteOnly,
  });

  return (
    <div className="w-full min-w-0 max-w-6xl space-y-4 pb-2">
      <div className="flex flex-col gap-3 sm:mb-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            CRM Leads
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track prospects, pricing, and follow-ups.
          </p>
        </div>
        <AddManualLeadDialog triggerClassName="w-full sm:w-auto justify-center" />
      </div>
      <LeadsFilters />
      <LeadsTable leads={leads} />
    </div>
  );
}
