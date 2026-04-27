import { getLeads } from "@/actions/leads-list";
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
    <div className="w-full min-w-0 max-w-6xl">
      <h1 className="mb-4 text-xl font-bold text-slate-900 sm:mb-6 sm:text-2xl dark:text-white">
        CRM Leads
      </h1>
      <LeadsFilters />
      <LeadsTable leads={leads} />
    </div>
  );
}
