import { getLeads } from "@/actions/leads-list";
import { parseLeadsPageQuery, parseLeadsPerPageQuery } from "@/lib/leads-query-limits";
import { hasProEntitlement } from "@/lib/entitlements";
import { prisma } from "@/lib/db";
import { requireDashboardUser } from "@/lib/session-user";
import { AddManualLeadDialog } from "./AddManualLeadDialog";
import { ExportActions } from "./ExportActions";
import { LeadsTable } from "./LeadsTable";
import { LeadsFilters } from "./LeadsFilters";
import { LeadsPagination, LeadsPaginationFooter } from "./LeadsPagination";

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
  const leadPage = parseLeadsPageQuery(
    typeof params.page === "string" ? params.page : undefined,
  );
  const leadPerPage = parseLeadsPerPageQuery(
    typeof params.perPage === "string" ? params.perPage : undefined,
  );

  const user = await requireDashboardUser();
  const [leadsResult, totalLeadsForExport] = await Promise.all([
    getLeads(
      {
        search,
        businessType,
        contactStatus,
        badge,
        minRating: Number.isFinite(minRating) ? minRating : undefined,
        minReviews: Number.isFinite(minReviews) ? minReviews : undefined,
        noWebsiteOnly,
      },
      { page: leadPage, perPage: leadPerPage },
    ),
    prisma.lead.count({ where: { userId: user.id } }),
  ]);
  const canExportCsv = hasProEntitlement(user);

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
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <AddManualLeadDialog triggerClassName="w-full sm:w-auto justify-center" />
          <ExportActions
            totalLeads={totalLeadsForExport}
            canExport={canExportCsv}
            triggerClassName="w-full sm:w-auto justify-center"
          />
        </div>
      </div>
      <LeadsFilters />
      <LeadsPagination
        total={leadsResult.total}
        page={leadsResult.page}
        perPage={leadsResult.perPage}
        totalPages={leadsResult.totalPages}
        truncated={leadsResult.truncated}
      />
      <LeadsTable leads={leadsResult.leads} />
      <LeadsPaginationFooter
        total={leadsResult.total}
        page={leadsResult.page}
        perPage={leadsResult.perPage}
        totalPages={leadsResult.totalPages}
        truncated={leadsResult.truncated}
      />
    </div>
  );
}
