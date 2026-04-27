"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createTradesCallQuick,
  type TradesActionState,
} from "@/actions/trades";
import { JOB_STATUS_LABEL } from "./trades-labels";

const init: TradesActionState = {};

export function CallQuickForm() {
  const [state, action, pending] = useActionState(
    createTradesCallQuick,
    init
  );
  const formRef = useRef<HTMLFormElement>(null);
  const prevSuccess = useRef(false);

  useEffect(() => {
    if (state?.success && !prevSuccess.current) {
      formRef.current?.reset();
    }
    prevSuccess.current = !!state?.success;
  }, [state?.success]);

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80"
    >
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
        New call or lead
      </h2>
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state?.success && !state.crmError && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</p>
      )}
      {state?.success && state.crmError && (
        <p className="text-sm text-amber-800 dark:text-amber-200">{state.crmError}</p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Name
          </label>
          <input
            name="name"
            required
            className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="Customer name"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Phone
          </label>
          <input
            name="phone"
            required
            type="tel"
            className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="(555) 000-0000"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Job / request
        </label>
        <input
          name="jobType"
          required
          className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          placeholder="e.g. Leak in kitchen, panel upgrade"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Status
          </label>
          <select
            name="status"
            defaultValue="new_call"
            className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            {Object.entries(JOB_STATUS_LABEL)
              .filter(([k]) => k !== "cancelled")
              .map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Optional visit time
          </label>
          <input
            name="scheduledAt"
            type="datetime-local"
            className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-2 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Quote / price (optional)
        </label>
        <input
          name="priceDollars"
          inputMode="decimal"
          className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          placeholder="0.00"
        />
      </div>
      <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-3 dark:border-indigo-500/30 dark:bg-indigo-950/20">
        <label className="flex cursor-pointer items-start gap-3 touch-manipulation">
          <input
            type="checkbox"
            name="addCrmLead"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          <span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Also add a marketing lead (CRM)
            </span>
            <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400">
              Saves to <strong>CRM Leads</strong> for follow-up, site pitches, and
              freelancing — same pipeline as &quot;Find businesses&quot; search.
            </span>
          </span>
        </label>
        <div className="mt-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Lead / business name for CRM
          </label>
          <input
            name="crmBusinessName"
            className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            placeholder="Defaults to customer name if empty"
            autoComplete="organization"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full min-h-[48px] rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white shadow transition hover:bg-amber-500 disabled:opacity-50 touch-manipulation"
      >
        {pending ? "Saving…" : "Add call & job"}
      </button>
    </form>
  );
}
