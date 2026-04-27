"use client";

import { useActionState, useRef, useEffect } from "react";
import { createTradesJob, type TradesActionState } from "@/actions/trades";
import { JOB_STATUS_LABEL } from "../../trades-labels";

const init: TradesActionState = {};

export function AddJobForm({ customerId }: { customerId: string }) {
  const [state, action, pending] = useActionState(
    createTradesJob,
    init
  );
  const r = useRef<HTMLFormElement>(null);
  const prev = useRef(false);
  useEffect(() => {
    if (state?.success && !prev.current) {
      r.current?.reset();
    }
    prev.current = !!state?.success;
  }, [state?.success]);
  return (
    <form
      ref={r}
      action={action}
      className="space-y-2 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/30 dark:bg-amber-950/20"
    >
      <input type="hidden" name="customerId" value={customerId} />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-emerald-600">Job added.</p>
      )}
      <input
        name="jobType"
        required
        placeholder="Job type (e.g. Re-wire kitchen)"
        className="w-full min-h-11 rounded-xl border border-amber-200/90 bg-white px-3"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select
          name="status"
          defaultValue="new_call"
          className="min-h-11 rounded-xl border border-amber-200/90 bg-white px-2"
        >
          {Object.entries(JOB_STATUS_LABEL)
            .filter(([k]) => k !== "cancelled")
            .map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
        </select>
        <input
          name="priceDollars"
          className="min-h-11 rounded-xl border border-amber-200/90 bg-white px-3"
          placeholder="Price $"
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="scheduledAt"
          type="datetime-local"
          className="min-h-11 rounded-xl border border-amber-200/90 bg-white px-2"
        />
        <label className="flex min-h-11 items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="paid" className="h-4 w-4" />
          Paid
        </label>
      </div>
      <textarea
        name="jobNotes"
        className="w-full rounded-xl border border-amber-200/90 bg-white px-3 py-2 text-sm"
        placeholder="Job notes"
        rows={2}
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full min-h-11 rounded-xl bg-amber-600 text-sm font-semibold text-white"
      >
        {pending ? "…" : "Add job"}
      </button>
    </form>
  );
}
