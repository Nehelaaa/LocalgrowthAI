"use client";

import { addDays, format, isSameDay } from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { rescheduleTradesJob } from "@/actions/trades";
import { JOB_STATUS_LABEL } from "./trades-labels";

type JobRow = {
  id: string;
  jobType: string;
  status: string;
  priceCents: number;
  paid: boolean;
  scheduledAt: string | null;
  createdAt: string;
  customer: { id: string; name: string; phone: string };
};

const fmtMoney = (c: number) =>
  (c / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });

function sortJobsForDay(list: JobRow[], d: Date): JobRow[] {
  const inDay = list.filter((j) => {
    if (j.scheduledAt) {
      return isSameDay(new Date(j.scheduledAt), d);
    }
    if (!j.scheduledAt) {
      return isSameDay(new Date(j.createdAt), d);
    }
    return false;
  });
  return inDay.sort((a, b) => {
    const at = a.scheduledAt
      ? new Date(a.scheduledAt).getTime()
      : new Date(a.createdAt).getTime();
    const bt = b.scheduledAt
      ? new Date(b.scheduledAt).getTime()
      : new Date(b.createdAt).getTime();
    return at - bt;
  });
}

export function ScheduleBoard({
  jobs: initialJobs,
  weekOffset,
  weekStartIso,
}: {
  jobs: JobRow[];
  weekOffset: number;
  weekStartIso: string;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);

  const week0 = useMemo(() => new Date(weekStartIso), [weekStartIso]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(week0, i)),
    [week0]
  );

  const jobs = initialJobs;

  const moveJobToDate = useCallback(
    (job: JobRow, targetDay: Date) => {
      const base = job.scheduledAt
        ? new Date(job.scheduledAt)
        : new Date();
      const next = new Date(targetDay);
      next.setHours(base.getHours(), base.getMinutes(), 0, 0);
      if (Number.isNaN(next.getTime())) return;

      const fd = new FormData();
      fd.set("id", job.id);
      fd.set("scheduledAt", next.toISOString());
      start(async () => {
        const r = await rescheduleTradesJob({}, fd);
        if (r?.error) {
          window.alert(r.error);
          return;
        }
        router.refresh();
      });
    },
    [router]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <a
          href={`/dashboard/trades/schedule?w=${weekOffset - 1}`}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-white touch-manipulation"
        >
          ←
        </a>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {format(week0, "MMM d")} – {format(addDays(week0, 6), "MMM d, yyyy")}
        </p>
        <a
          href={`/dashboard/trades/schedule?w=${weekOffset + 1}`}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-white touch-manipulation"
        >
          →
        </a>
      </div>
      {isPending && (
        <p className="text-xs text-amber-700 dark:text-amber-300">Updating…</p>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        <span className="hidden md:inline">Drag a job to another day to reschedule.</span>
        <span className="md:hidden">Use{" "}
          <span className="font-medium text-amber-700">Change day</span>{" "}
          on each card, or open the call list to edit the time.
        </span>
      </p>
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7"
        id="board"
      >
        {days.map((d) => {
          const key = d.toISOString();
          const dayJobs = sortJobsForDay(jobs, d);
          return (
            <div
              key={key}
              className="min-h-[200px] rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/80 p-2 dark:border-slate-700/80 dark:bg-slate-900/40"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/jobId");
                const j = jobs.find((x) => x.id === id);
                if (j) moveJobToDate(j, d);
                setDragId(null);
              }}
            >
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {format(d, "EEE")}{" "}
                <span className="text-slate-800 dark:text-slate-200">
                  {format(d, "d")}
                </span>
              </p>
              <div className="space-y-2">
                {dayJobs.map((j) => (
                  <div
                    key={j.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/jobId", j.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragId(j.id);
                    }}
                    onDragEnd={() => setDragId(null)}
                    className={
                      "cursor-grab rounded-xl border p-2.5 text-left shadow-sm touch-manipulation active:cursor-grabbing " +
                      (dragId === j.id
                        ? "border-amber-400 ring-1 ring-amber-300/60"
                        : "border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800/80")
                    }
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {j.customer.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {j.jobType}
                    </p>
                    <p className="mt-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                      {JOB_STATUS_LABEL[j.status] ?? j.status}
                    </p>
                    {j.priceCents > 0 && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {fmtMoney(j.priceCents)} ·{" "}
                        {j.paid ? "Paid" : "Unpaid"}
                      </p>
                    )}
                    <details className="mt-1 md:hidden">
                      <summary className="cursor-pointer text-xs text-amber-700">
                        Change day…
                      </summary>
                      <form
                        className="mt-1 flex flex-wrap gap-1"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const f = e.currentTarget;
                          const day = f.querySelector<HTMLInputElement>(
                            'input[name="toDay"]'
                          )?.value;
                          if (!day) return;
                          moveJobToDate(j, new Date(`${day}T12:00:00`));
                        }}
                      >
                        <input
                          type="date"
                          name="toDay"
                          className="min-h-10 min-w-0 flex-1 rounded border border-slate-200 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          defaultValue={format(
                            j.scheduledAt
                              ? new Date(j.scheduledAt)
                              : new Date(),
                            "yyyy-MM-dd"
                          )}
                        />
                        <button
                          type="submit"
                          className="min-h-10 rounded bg-amber-600 px-2 text-xs font-medium text-white"
                        >
                          Move
                        </button>
                      </form>
                    </details>
                  </div>
                ))}
                {dayJobs.length === 0 && (
                  <p className="py-6 text-center text-xs text-slate-400">Empty</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
