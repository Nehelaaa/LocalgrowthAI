"use client";

import { useActionState, useRef, useEffect } from "react";
import { createTradesCustomer, type TradesActionState } from "@/actions/trades";

const init: TradesActionState = {};

export function CreateCustomerForm() {
  const [state, action, pending] = useActionState(
    createTradesCustomer,
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
      className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900/50"
    >
      <h2 className="text-sm font-semibold">Add customer only</h2>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && !state.crmError && (
        <p className="text-sm text-emerald-600">Customer saved.</p>
      )}
      {state?.success && state.crmError && (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          {state.crmError}
        </p>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="name"
          required
          placeholder="Name"
          className="min-h-[44px] rounded-xl border border-slate-200 px-3 text-base"
        />
        <input
          name="phone"
          required
          type="tel"
          placeholder="Phone"
          className="min-h-[44px] rounded-xl border border-slate-200 px-3 text-base"
        />
      </div>
      <textarea
        name="notes"
        rows={2}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        placeholder="Notes (optional)"
      />
      <textarea
        name="issues"
        rows={2}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        placeholder="Known issues (optional)"
      />
      <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-3 dark:border-indigo-500/30 dark:bg-indigo-950/20">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="addCrmLead"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          <span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Also save as a CRM (marketing) lead
            </span>
            <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400">
              Puts a row in <strong>CRM Leads</strong> for your freelancing and website
              outreach — in addition to this service customer.
            </span>
          </span>
        </label>
        <div className="mt-2">
          <input
            name="crmBusinessName"
            className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3"
            placeholder="Company / lead name (defaults to customer name)"
            autoComplete="organization"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full min-h-11 rounded-xl bg-slate-900 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
      >
        {pending ? "…" : "Add customer"}
      </button>
    </form>
  );
}
