import { addWeeks, startOfWeek, addDays } from "date-fns";
import { listTradesJobsInRange } from "@/actions/trades";
import { requireTradesDashboardUser } from "@/lib/trades-access";
import { ScheduleBoard } from "../ScheduleBoard";

type Props = { searchParams: Promise<{ w?: string }> };

export default async function TradesSchedulePage({ searchParams }: Props) {
  await requireTradesDashboardUser();
  const sp = await searchParams;
  const w = Math.max(
    -26,
    Math.min(26, Math.floor(Number.parseInt(String(sp.w ?? "0"), 10) || 0))
  );
  const now = new Date();
  const week0 = addWeeks(startOfWeek(now, { weekStartsOn: 0 }), w);
  const end = addDays(week0, 7);
  const rows = await listTradesJobsInRange(week0, end);
  const jobs = rows.map((j) => ({
    id: j.id,
    jobType: j.jobType,
    status: j.status,
    priceCents: j.priceCents,
    paid: j.paid,
    scheduledAt: j.scheduledAt?.toISOString() ?? null,
    createdAt: j.createdAt.toISOString(),
    customer: {
      id: j.customer.id,
      name: j.customer.name,
      phone: j.customer.phone,
    },
  }));
  return (
    <div className="w-full min-w-0 max-w-7xl">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
          Job schedule
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          This week: drag a card to another day on desktop, or use{" "}
          <span className="font-medium">Change day</span> on your phone.
        </p>
      </header>
      <ScheduleBoard
        jobs={jobs}
        weekOffset={w}
        weekStartIso={week0.toISOString()}
      />
    </div>
  );
}
