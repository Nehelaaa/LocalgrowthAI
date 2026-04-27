"use client";

import { useActionState } from "react";
import { updateTradesJob, type TradesActionState } from "@/actions/trades";
import { JOB_STATUS_LABEL } from "../../trades-labels";

const init: TradesActionState = {};

function toLocalInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function JobRowEdit(props: {
  id: string;
  jobType: string;
  status: string;
  priceCents: number;
  paid: boolean;
  scheduledAt: string;
  notes: string | null;
}) {
  const [state, action, pending] = useActionState(
    updateTradesJob,
    init
  );
  return (
    <form action={action} className="space-y-2 text-sm">
      <input type="hidden" name="id" value={props.id} />
      <p className="font-medium text-slate-900 dark:text-slate-100">
        {props.jobType}
      </p>
      {state?.error && (
        <p className="text-red-600">{state.error}</p>
      )}
      {state?.success && <p className="text-emerald-600">Updated.</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="jobType"
          defaultValue={props.jobType}
          className="min-h-10 rounded-lg border border-slate-200 px-2"
        />
        <select
          name="status"
          defaultValue={props.status}
          className="min-h-10 rounded-lg border border-slate-200 px-2"
        >
          {Object.entries(JOB_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input
          name="priceDollars"
          defaultValue={props.priceCents / 100}
          className="min-h-10 rounded-lg border border-slate-200 px-2"
        />
        <input
          name="scheduledAt"
          type="datetime-local"
          defaultValue={toLocalInput(props.scheduledAt)}
          className="min-h-10 rounded-lg border border-slate-200 px-1 text-xs"
        />
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="paid"
          defaultChecked={props.paid}
          className="h-4 w-4"
        />
        Paid
      </label>
      <textarea
        name="jobNotes"
        defaultValue={props.notes ?? ""}
        className="w-full rounded-lg border border-slate-200 px-2 py-1"
        rows={2}
      />
      <button
        type="submit"
        disabled={pending}
        className="min-h-9 rounded-lg bg-slate-200 px-3 text-slate-800 dark:bg-slate-700 dark:text-slate-100"
      >
        {pending ? "…" : "Update job"}
      </button>
    </form>
  );
}
