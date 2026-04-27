import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireTradesDashboardUser } from "@/lib/trades-access";
import { AddJobForm } from "./AddJobForm";
import { CustomerEditForm } from "./CustomerEditForm";
import { JobRowEdit } from "./JobRowEdit";
import { JOB_STATUS_LABEL } from "../../trades-labels";

type Props = { params: Promise<{ id: string }> };

export default async function TradesCustomerPage({ params }: Props) {
  const u = await requireTradesDashboardUser();
  const { id } = await params;
  const c = await prisma.tradesCustomer.findFirst({
    where: { id, userId: u.id },
    include: { jobs: { orderBy: { createdAt: "desc" } } },
  });
  if (!c) {
    notFound();
  }

  return (
    <div className="w-full min-w-0 max-w-2xl space-y-6">
      <Link
        href="/dashboard/trades/customers"
        className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
      >
        ← All customers
      </Link>
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {c.name}
        </h1>
        <p className="text-slate-500">{c.phone}</p>
      </header>
      <CustomerEditForm
        id={c.id}
        name={c.name}
        phone={c.phone}
        notes={c.notes}
        issues={c.issues}
      />
      <div>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Add job
        </h2>
        <div className="mt-2">
          <AddJobForm customerId={c.id} />
        </div>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Past jobs
        </h2>
        {c.jobs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No jobs yet for this customer.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {c.jobs.map((j) => (
              <li
                key={j.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900/60"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {JOB_STATUS_LABEL[j.status] ?? j.status}
                  </p>
                  {j.priceCents > 0 && (
                    <Link
                      className="text-sm font-medium text-amber-800 underline"
                      href={`/dashboard/trades/jobs/${j.id}/invoice`}
                    >
                      Invoice
                    </Link>
                  )}
                </div>
                <JobRowEdit
                  id={j.id}
                  jobType={j.jobType}
                  status={j.status}
                  priceCents={j.priceCents}
                  paid={j.paid}
                  scheduledAt={j.scheduledAt?.toISOString() ?? ""}
                  notes={j.notes}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
