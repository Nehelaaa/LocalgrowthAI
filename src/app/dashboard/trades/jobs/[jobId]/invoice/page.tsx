import Link from "next/link";
import { notFound } from "next/navigation";
import { getTradesJobForUser } from "@/actions/trades";
import { requireTradesDashboardUser } from "@/lib/trades-access";
import { PrintButton } from "./PrintButton";

const money = (c: number) =>
  (c / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });

type Props = { params: Promise<{ jobId: string }> };

export default async function TradesInvoicePage({ params }: Props) {
  await requireTradesDashboardUser();
  const { jobId } = await params;
  const j = await getTradesJobForUser(jobId);
  if (!j) {
    notFound();
  }
  const name = j.user.name ?? j.user.email;

  return (
    <div className="w-full min-w-0 max-w-2xl">
      <div className="mb-4 print:hidden">
        <Link
          href={`/dashboard/trades/customers/${j.customer.id}`}
          className="text-sm font-medium text-indigo-600"
        >
          ← Back to customer
        </Link>
        <div className="mt-2">
          <PrintButton />
        </div>
      </div>
      <article
        className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm print:shadow-none"
        id="invoice"
      >
        <header className="border-b border-slate-200 pb-4">
          <p className="text-sm font-semibold text-amber-800">Invoice / receipt</p>
          <h1 className="mt-1 text-2xl font-bold">{name}</h1>
          <p className="text-sm text-slate-500">{j.user.email}</p>
        </header>
        <div className="mt-4 grid gap-1 text-sm">
          <p>
            <span className="text-slate-500">Customer: </span>
            <span className="font-medium">{j.customer.name}</span>
          </p>
          <p>
            <span className="text-slate-500">Phone: </span>
            {j.customer.phone}
          </p>
          <p>
            <span className="text-slate-500">Service: </span>
            {j.jobType}
          </p>
          {j.scheduledAt && (
            <p>
              <span className="text-slate-500">Scheduled: </span>
              {j.scheduledAt.toLocaleString()}
            </p>
          )}
        </div>
        <div className="mt-6 border-t border-slate-200 pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-slate-600">Amount</span>
            <span className="text-2xl font-bold tabular-nums">
              {money(j.priceCents)}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {j.paid ? "Status: paid" : "Status: payment due"}
          </p>
        </div>
        {j.notes && (
          <div className="mt-4 text-sm text-slate-600">
            <p className="font-medium text-slate-500">Notes</p>
            <p className="whitespace-pre-wrap">{j.notes}</p>
          </div>
        )}
        <p className="mt-8 text-xs text-slate-400">
          Thank you for your business.
        </p>
      </article>
    </div>
  );
}
