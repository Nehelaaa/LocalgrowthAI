import { getDashboardMetrics } from "@/actions/metrics";
import Link from "next/link";
import type { ReactNode } from "react";

const toneRing: Record<string, string> = {
  indigo:
    "ring-indigo-200/60 hover:ring-indigo-300/80 dark:ring-indigo-500/20 dark:hover:ring-indigo-400/40",
  violet:
    "ring-violet-200/60 hover:ring-violet-300/80 dark:ring-violet-500/20 dark:hover:ring-violet-400/40",
  emerald:
    "ring-emerald-200/60 hover:ring-emerald-300/80 dark:ring-emerald-500/20 dark:hover:ring-emerald-400/40",
  amber:
    "ring-amber-200/60 hover:ring-amber-300/80 dark:ring-amber-500/20 dark:hover:ring-amber-400/40",
  rose: "ring-rose-200/60 hover:ring-rose-300/80 dark:ring-rose-500/20 dark:hover:ring-rose-400/40",
  slate: "ring-slate-200/60 hover:ring-slate-300/80 dark:ring-slate-600/30 dark:hover:ring-slate-500/50",
};

const iconClass = "h-6 w-6";

const cardsData = (m: Awaited<ReturnType<typeof getDashboardMetrics>>) =>
  [
    {
      label: "Total leads",
      value: m.totalLeads,
      href: "/dashboard/leads" as const,
      tone: "indigo" as const,
      description: "All businesses in your CRM",
      icon: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
    },
    {
      label: "No website",
      value: m.noWebsiteCount,
      href: "/dashboard/leads?filter=no-website" as const,
      tone: "violet" as const,
      description: "High intent — pitch a site",
      icon: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5" />
        </svg>
      ),
    },
    {
      label: "Contacts made",
      value: m.contactsMade,
      href: "/dashboard/leads" as const,
      tone: "emerald" as const,
      description: "Leads you’ve reached",
      icon: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.654a.563.563 0 0 1 .63-.115c1.14.4 2.32.7 3.5.9.5.1 1.01.1 1.5.1A5.25 5.25 0 0 0 20.25 6.75C20.25 4.5 18 3 15.75 3H8.25A5.25 5.25 0 0 0 3 8.25c0 1.2.1 1.2.1 1.2Z"
          />
        </svg>
      ),
    },
    {
      label: "Conversion rate",
      value: `${m.conversionRate}%`,
      tone: "amber" as const,
      description: "Contacted → won / lost",
      icon: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 0 5.814-5.518l1.1-1.1M2.25 4.5l6.75 6.75" />
        </svg>
      ),
    },
    {
      label: "Closed won",
      value: m.closedWon,
      href: "/dashboard/leads" as const,
      tone: "rose" as const,
      description: "Wins this pipeline",
      icon: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 15.75h3.375A2.25 2.25 0 0 0 10.5 8.25h-3a2.25 2.25 0 0 0-2.25 2.25V15m.75 0h9"
          />
        </svg>
      ),
    },
    {
      label: "Won deal value",
      value: `$${m.closedWonWebsiteValue.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`,
      tone: "slate" as const,
      description: "Sum of website price on closed-won leads",
      icon: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18.75a60.07 60.07 0 0 0 15.397 1.5M2.25 5.25a60.07 60.07 0 0 0 15.397-1.5M7.5 4.5h9a1.5 1.5 0 0 1 1.5 1.5V9A1.5 1.5 0 0 1 16.5 10.5h-9A1.5 1.5 0 0 1 6 9V6a1.5 1.5 0 0 1 1.5-1.5Z"
          />
        </svg>
      ),
    },
  ];

function iconWrap(
  tone: keyof typeof toneRing,
  children: ReactNode
) {
  const map: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
  };
  return (
    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${map[tone]}`}>
      {children}
    </div>
  );
}

export default async function DashboardPage() {
  const m = await getDashboardMetrics();
  const cards = cardsData(m);

  return (
    <div className="w-full min-w-0 max-w-6xl">
      <header className="mb-8 max-w-5xl sm:mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Today
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-base text-slate-600 dark:text-slate-400">
          Your pipeline at a glance — find prospects, work leads, and close more projects.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => {
          const ring = toneRing[c.tone];
          const body = (
            <>
              {iconWrap(c.tone, c.icon)}
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{c.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{c.value}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{c.description}</p>
            </>
          );
          const className = `group block overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm ring-1 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-800/80 dark:bg-slate-900/60 ${ring}`;
          if ("href" in c && c.href) {
            return (
              <Link key={c.label} href={c.href} className={className} aria-label={`${c.label}: ${c.value}`}>
                {body}
              </Link>
            );
          }
          return (
            <div key={c.label} className={className}>
              {body}
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex max-w-2xl flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
        <Link
          href="/dashboard/search"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-violet-500 hover:to-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          Find businesses
        </Link>
        <Link
          href="/dashboard/leads"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300/90 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/80 hover:text-indigo-800 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200"
        >
          View all leads
        </Link>
      </div>
    </div>
  );
}
