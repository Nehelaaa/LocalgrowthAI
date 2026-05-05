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
        <AddManualLeadDialog triggerClassName="w-full sm:w-auto justify-center" />
      </div>
      <LeadsFilters />
      <section
        id="export"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        aria-labelledby="crm-export-heading"
      >
        <h2
          id="crm-export-heading"
          className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          Export leads
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Download your full lead list as CSV ({totalLeadsForExport} saved), or use the JSON API with integrations.
        </p>
        <div className="mt-4">
          <ExportActions totalLeads={totalLeadsForExport} canExport={canExportCsv} />
        </div>
        <div className="mt-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 p-4 dark:bg-slate-800/40">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">API export</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            GET{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-900">
              /api/export/leads
            </code>{" "}
            returns all leads as JSON. Pair with Zapier, Make, or Google Sheets apps.
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
            Webhooks: POST new-lead payloads to your URL when configured via environment variables.
          </p>
        </div>
      </section>
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
