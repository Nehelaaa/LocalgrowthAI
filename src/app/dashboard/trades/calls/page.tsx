import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireTradesDashboardUser } from "@/lib/trades-access";
import { CallQuickForm } from "../CallQuickForm";
import { JOB_STATUS_LABEL } from "../trades-labels";

const money = (c: number) =>
  (c / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });

export default async function TradesCallsPage() {
  const u = await requireTradesDashboardUser();
  const recent = await prisma.tradesJob.findMany({
    where: { userId: u.id },
    orderBy: { updatedAt: "desc" },
    take: 40,
    include: { customer: true },
  });

  return (
    <div className="w-full min-w-0 max-w-2xl space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
          Calls &amp; lead tracker
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Add a service customer and job. Optionally add the same person (or a
          business you&apos;re pitching) to your main{" "}
          <Link
            className="font-medium text-indigo-600 dark:text-indigo-400"
            href="/dashboard/leads"
          >
            CRM Leads
          </Link>{" "}
          for website and freelancing follow-up.
        </p>
      </header>
      <CallQuickForm />
      <div>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Recent jobs
        </h2>
        <ul className="mt-2 space-y-2">
          {recent.map((j) => (
            <li
              key={j.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900/60"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {j.customer.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {j.jobType}
                  </p>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="text-amber-800 dark:text-amber-200">
                    {JOB_STATUS_LABEL[j.status] ?? j.status}
                  </p>
                  {j.priceCents > 0 && (
                    <p className="mt-0.5 text-slate-700 tabular-nums dark:text-slate-300">
                      {money(j.priceCents)} · {j.paid ? "Paid" : "Unpaid"}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <Link
                  className="min-h-10 min-w-[48px] inline-flex items-center text-indigo-600 underline font-medium"
                  href={`/dashboard/trades/customers/${j.customer.id}`}
                >
                  Customer
                </Link>
                {j.priceCents > 0 && (
                  <Link
                    className="min-h-10 min-w-[48px] inline-flex items-center text-amber-800 font-medium"
                    href={`/dashboard/trades/jobs/${j.id}/invoice`}
                  >
                    Invoice
                  </Link>
                )}
              </div>
            </li>
          ))}
          {recent.length === 0 && (
            <li className="rounded-2xl border border-dashed border-slate-200/90 px-4 py-6 text-center text-sm text-slate-500">
              No jobs yet. Add a call above.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
