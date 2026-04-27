"use client";

import { useActionState, useRef, useEffect } from "react";
import { updateTradesCustomer, type TradesActionState } from "@/actions/trades";

const init: TradesActionState = {};

export function CustomerEditForm(props: {
  id: string;
  name: string;
  phone: string;
  notes: string | null;
  issues: string | null;
}) {
  const [state, action, pending] = useActionState(
    updateTradesCustomer,
    init
  );
  const formRef = useRef<HTMLFormElement>(null);
  const prev = useRef(false);
  useEffect(() => {
    if (state?.success && !prev.current) {
      // keep fields
    }
    prev.current = !!state?.success;
  }, [state?.success]);
  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/40"
    >
      <input type="hidden" name="id" value={props.id} />
      <h2 className="text-sm font-semibold">Customer details</h2>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-600">Saved.</p>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="name"
          required
          defaultValue={props.name}
          className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3"
        />
        <input
          name="phone"
          required
          type="tel"
          defaultValue={props.phone}
          className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3"
        />
      </div>
      <textarea
        name="notes"
        rows={3}
        defaultValue={props.notes ?? ""}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        placeholder="General notes"
      />
      <textarea
        name="issues"
        rows={3}
        defaultValue={props.issues ?? ""}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        placeholder="Issues, warranty notes, what to watch on return visits"
      />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-xl bg-slate-800 text-sm font-semibold text-white dark:bg-slate-200 dark:text-slate-900"
      >
        {pending ? "Saving…" : "Save customer"}
      </button>
    </form>
  );
}
