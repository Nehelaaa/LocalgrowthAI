import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireTradesDashboardUser } from "@/lib/trades-access";
import { CreateCustomerForm } from "./CreateCustomerForm";

export default async function TradesCustomersPage() {
  const u = await requireTradesDashboardUser();
  const customers = await prisma.tradesCustomer.findMany({
    where: { userId: u.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { _count: { select: { jobs: true } } },
  });

  return (
    <div className="w-full min-w-0 max-w-2xl space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
          Customers
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Open a customer for past jobs, notes, and issues.
        </p>
      </header>
      <CreateCustomerForm />
      <ul className="space-y-2">
        {customers.map((c) => (
          <li key={c.id}>
            <Link
              href={`/dashboard/trades/customers/${c.id}`}
              className="block rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900/60"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {c.name}
                  </p>
                  <p className="text-sm text-slate-500">{c.phone}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {c._count.jobs} job{c._count.jobs === 1 ? "" : "s"}
                </span>
              </div>
            </Link>
          </li>
        ))}
        {customers.length === 0 && (
          <li className="rounded-2xl border border-dashed border-slate-200/90 py-6 text-center text-sm text-slate-500">
            No customers yet. Add one or log a new call.
          </li>
        )}
      </ul>
    </div>
  );
}
