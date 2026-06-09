"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AddManualLeadDialog } from "@/app/dashboard/leads/AddManualLeadDialog";
import { LeadMapCanvas } from "@/components/dashboard/LeadMapCanvas";
import type { DashboardMetrics, DashboardLeadRow } from "@/actions/metrics";
import type { ContactStatus } from "@prisma/client";

const panel =
  "rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/90";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatCurrency(n: number): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatRelativeTime(d: Date): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const STAGE_LABELS: Record<ContactStatus, string> = {
  NOT_CONTACTED: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  CLOSED_WON: "Closed",
  CLOSED_LOST: "Archived",
};

function stagePillClass(status: ContactStatus): string {
  switch (status) {
    case "NOT_CONTACTED":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    case "CONTACTED":
      return "bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200";
    case "INTERESTED":
      return "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200";
    case "CLOSED_WON":
      return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
    case "CLOSED_LOST":
      return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function SummaryStrip({ metrics }: { metrics: DashboardMetrics }) {
  const items = [
    {
      label: "Pipeline Value",
      value: formatCurrency(metrics.pipelineValue),
      href: "/dashboard/leads",
    },
    {
      label: "Active Leads",
      value: metrics.activeLeads.toLocaleString(),
      href: "/dashboard/leads",
    },
    {
      label: "Hot Leads",
      value: metrics.hotLeads.toLocaleString(),
      href: "/dashboard/leads?badge=HOT",
    },
    {
      label: "Outreach Sent",
      value: metrics.contactsMade.toLocaleString(),
      href: "/dashboard/leads",
    },
    {
      label: "Closed Deals",
      value: metrics.closedWon.toLocaleString(),
      href: "/dashboard/leads?status=CLOSED_WON",
    },
  ];

  return (
    <div className={`${panel} overflow-hidden`}>
      <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y lg:grid-cols-5 lg:divide-y-0 dark:divide-slate-800">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group flex flex-col gap-1 px-4 py-4 transition hover:bg-slate-50/80 sm:px-5 sm:py-5 dark:hover:bg-slate-800/40"
          >
            <span className="text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">
              {item.label}
            </span>
            <span className="text-lg font-semibold tabular-nums tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              {item.value}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function LeadFunnel({ metrics }: { metrics: DashboardMetrics }) {
  const { funnel } = metrics;
  const stages = [
    { key: "new", label: "New", count: funnel.new },
    { key: "contacted", label: "Contacted", count: funnel.contacted },
    { key: "interested", label: "Interested", count: funnel.interested },
    { key: "proposalSent", label: "Proposal Sent", count: funnel.proposalSent },
    { key: "closed", label: "Closed", count: funnel.closed },
  ];
  const max = Math.max(...stages.map((s) => s.count), 1);

  return (
    <section className={panel}>
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Lead funnel</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Where your pipeline stands today
        </p>
      </div>
      <div className="space-y-4 p-5">
        {stages.map((stage, i) => (
          <div key={stage.key} className="flex items-center gap-3">
            <div className="flex w-28 shrink-0 items-center gap-2 sm:w-32">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-semibold text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                {i + 1}
              </span>
              <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                {stage.label}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${Math.max(4, (stage.count / max) * 100)}%` }}
                />
              </div>
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
              {stage.count}
            </span>
          </div>
        ))}
        {metrics.activeLeads === 0 ? (
          <p className="pt-1 text-center text-xs text-slate-500 dark:text-slate-400">
            Add businesses to start tracking your funnel.{" "}
            <Link href="/dashboard/search" className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400">
              Find new businesses →
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}

function RecentLeadActions({ lead }: { lead: DashboardLeadRow }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {lead.phone ? (
        <a
          href={`tel:${lead.phone.replace(/\D/g, "")}`}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-violet-300 hover:text-violet-700 sm:flex-none sm:px-3 sm:text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-violet-500/50 dark:hover:text-violet-300"
        >
          Contact
        </a>
      ) : null}
      <Link
        href={`/dashboard/leads?search=${encodeURIComponent(lead.businessName)}`}
        className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 sm:flex-none sm:px-3 sm:text-xs dark:bg-violet-500 dark:hover:bg-violet-400"
      >
        View
        <span aria-hidden className="text-violet-200 dark:text-violet-300/80">→</span>
      </Link>
    </div>
  );
}

function RecentLeadsTable({ leads }: { leads: DashboardLeadRow[] }) {
  return (
    <section className={`${panel} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 sm:px-5 dark:border-slate-800">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent leads</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Latest updates in your pipeline
          </p>
        </div>
        <Link
          href="/dashboard/leads"
          className="shrink-0 text-xs font-semibold text-violet-600 hover:text-violet-500 dark:text-violet-400"
        >
          View all →
        </Link>
      </div>

      {leads.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          No active leads yet. Search for local businesses to get started.
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
            {leads.map((lead) => (
              <div key={lead.id} className="space-y-3 px-4 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white">{lead.businessName}</p>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`inline-flex rounded-md px-2 py-1 font-medium ${stagePillClass(lead.contactStatus)}`}
                  >
                    {STAGE_LABELS[lead.contactStatus]}
                  </span>
                  <span
                    className={
                      lead.hasWebsite
                        ? "text-slate-500 dark:text-slate-400"
                        : "font-medium text-violet-600 dark:text-violet-400"
                    }
                  >
                    {lead.hasWebsite ? "Has site" : "No website"}
                  </span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    Score {lead.leadScore}
                  </span>
                  {lead.badge === "HOT" ? (
                    <span className="font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                      Hot
                    </span>
                  ) : null}
                </div>
                <RecentLeadActions lead={lead} />
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3">Business</th>
                  <th className="px-3 py-3">City</th>
                  <th className="px-3 py-3">Website</th>
                  <th className="px-3 py-3">Stage</th>
                  <th className="px-3 py-3">Score</th>
                  <th className="w-40 min-w-40 px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leads.map((lead) => (
                  <tr key={lead.id} className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900 dark:text-white">{lead.businessName}</p>
                      {lead.badge === "HOT" ? (
                        <span className="mt-0.5 inline-flex text-[10px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                          Hot
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3.5 text-slate-600 dark:text-slate-400">
                      {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={
                          lead.hasWebsite
                            ? "text-slate-600 dark:text-slate-400"
                            : "font-medium text-violet-600 dark:text-violet-400"
                        }
                      >
                        {lead.hasWebsite ? "Has site" : "No website"}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${stagePillClass(lead.contactStatus)}`}
                      >
                        {STAGE_LABELS[lead.contactStatus]}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                      {lead.leadScore}
                    </td>
                    <td className="w-40 min-w-40 px-5 py-3.5">
                      <div className="flex flex-nowrap items-center justify-end gap-1.5">
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone.replace(/\D/g, "")}`}
                            className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-violet-500/50 dark:hover:text-violet-300"
                          >
                            Contact
                          </a>
                        ) : null}
                        <Link
                          href={`/dashboard/leads?search=${encodeURIComponent(lead.businessName)}`}
                          className="inline-flex h-9 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md bg-violet-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-500 dark:bg-violet-500 dark:hover:bg-violet-400"
                        >
                          View
                          <span aria-hidden className="text-violet-200 dark:text-violet-300/80">→</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function SidebarPanel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={panel}>
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function TodaysFollowUps({ items }: { items: DashboardMetrics["todayFollowUps"] }) {
  return (
    <SidebarPanel title="Today's follow-ups" subtitle="Due today">
      {items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Nothing scheduled for today. Set follow-up dates on your leads.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/dashboard/leads?search=${encodeURIComponent(item.businessName)}`}
                className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <input
                  type="checkbox"
                  readOnly
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">
                    {item.businessName}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {STAGE_LABELS[item.contactStatus]}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SidebarPanel>
  );
}

function HotLeadsList({ leads }: { leads: DashboardLeadRow[] }) {
  return (
    <SidebarPanel
      title="Hot leads"
      subtitle="Highest intent"
      action={
        <Link
          href="/dashboard/leads?badge=HOT"
          className="shrink-0 text-xs font-semibold text-violet-600 hover:text-violet-500 dark:text-violet-400"
        >
          See all
        </Link>
      }
    >
      {leads.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No HOT leads right now. Focus on businesses with no website for higher scores.
        </p>
      ) : (
        <ul className="space-y-2">
          {leads.map((lead) => (
            <li key={lead.id}>
              <Link
                href={`/dashboard/leads?search=${encodeURIComponent(lead.businessName)}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span className="min-w-0 truncate text-sm font-medium text-slate-900 dark:text-white">
                  {lead.businessName}
                </span>
                <span className="shrink-0 rounded-md bg-orange-50 px-1.5 py-0.5 text-xs font-bold tabular-nums text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                  {lead.leadScore}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SidebarPanel>
  );
}

function RecentActivity({ items }: { items: DashboardMetrics["recentActivity"] }) {
  return (
    <SidebarPanel title="Recent activity">
      {items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Activity will appear here as you work leads and generate outreach.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" aria-hidden />
              <span className="min-w-0 flex-1">
                {item.leadId ? (
                  <Link
                    href={`/dashboard/leads`}
                    className="block text-sm text-slate-700 hover:text-violet-700 dark:text-slate-300 dark:hover:text-violet-300"
                  >
                    {item.message}
                  </Link>
                ) : (
                  <span className="block text-sm text-slate-700 dark:text-slate-300">{item.message}</span>
                )}
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {formatRelativeTime(item.time)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </SidebarPanel>
  );
}

function LeadMap({
  cities,
  cityPins,
  mapStats,
}: {
  cities: DashboardMetrics["mapCities"];
  cityPins: DashboardMetrics["mapCityPins"];
  mapStats: DashboardMetrics["mapStats"];
}) {
  const { activeLeads, onMap, unmapped, cityCount } = mapStats;

  const subtitle =
    onMap === 0
      ? `${activeLeads} active leads — add location data to see them on the map`
      : `${onMap} of ${activeLeads} active leads across ${cityCount} ${cityCount === 1 ? "city" : "cities"}`;

  return (
    <section className={panel}>
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Lead map</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_240px]">
        <div className="relative h-[320px] overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-violet-950/20 dark:to-indigo-950/20">
          <LeadMapCanvas pins={cityPins} />
        </div>
        <div className="flex min-h-0 flex-col">
          <ul className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {cities.length === 0 ? (
              <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                No city data yet
              </li>
            ) : (
              cities.map((c) => (
                <li
                  key={c.city}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50"
                >
                  <span className="min-w-0 truncate font-medium text-slate-800 dark:text-slate-200">
                    {c.city}
                  </span>
                  <span className="ml-2 shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
                    {c.count} {c.count === 1 ? "lead" : "leads"}
                  </span>
                </li>
              ))
            )}
          </ul>
          {unmapped > 0 ? (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {unmapped} {unmapped === 1 ? "lead" : "leads"} missing location data
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function QuickLinks({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/dashboard/leads?noWebsite=1"
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-violet-200 hover:text-violet-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-violet-500/40"
      >
        Website Opportunities · {metrics.noWebsiteCount}
      </Link>
      <Link
        href="/dashboard/leads?status=CLOSED_LOST"
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-violet-200 hover:text-violet-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-violet-500/40"
      >
        Archived Leads · {metrics.notInterested}
      </Link>
      {metrics.closedWonWebsiteValue > 0 ? (
        <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Won deal value · {formatCurrency(metrics.closedWonWebsiteValue)}
        </span>
      ) : null}
    </div>
  );
}

export function DashboardOverview({
  userName,
  metrics,
}: {
  userName: string;
  metrics: DashboardMetrics;
}) {
  return (
    <div className="w-full min-w-0 max-w-7xl space-y-6 overflow-x-hidden pb-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem] dark:text-white">
            {greeting()}, {userName}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Here&apos;s what needs attention in your pipeline today.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Link
            href="/dashboard/search"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 sm:w-auto dark:bg-violet-500 dark:hover:bg-violet-400"
          >
            Find New Businesses
          </Link>
          <AddManualLeadDialog
            variant="secondary"
            triggerLabel="Add Lead"
            triggerClassName="min-h-[44px] w-full sm:w-auto"
          />
        </div>
      </header>

      {/* Summary strip */}
      <SummaryStrip metrics={metrics} />

      {/* Quick links — preserve secondary metrics access */}
      <QuickLinks metrics={metrics} />

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <LeadFunnel metrics={metrics} />
          <RecentLeadsTable leads={metrics.recentLeads} />
        </div>
        <aside className="min-w-0 space-y-4">
          <TodaysFollowUps items={metrics.todayFollowUps} />
          <HotLeadsList leads={metrics.hotLeadsList} />
          <RecentActivity items={metrics.recentActivity} />
        </aside>
      </div>

      {/* Lead map */}
      <LeadMap cities={metrics.mapCities} cityPins={metrics.mapCityPins} mapStats={metrics.mapStats} />
    </div>
  );
}

export type { DashboardMetrics };
