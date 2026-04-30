"use client";

import { ManageBillingButton } from "@/components/dashboard/ManageBillingButton";

type Props = {
  hasStripeSub: boolean;
  isPro: boolean;
};

/**
 * Current plan card: Manage (Stripe portal) or anchor to comparison for Starter — main upgrade lives on the Pro column.
 */
export function PlanCurrentActions({ hasStripeSub, isPro }: Props) {
  if (hasStripeSub) {
    return (
      <ManageBillingButton
        variant="outline"
        className="w-full justify-center border-slate-200 py-2.5 text-sm font-medium sm:w-auto sm:min-w-[120px]"
        label="Manage"
      />
    );
  }
  if (!isPro) {
    return (
      <a
        href="#compare-plans"
        className="inline-flex w-full min-w-[120px] items-center justify-center rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
      >
        Compare plans
      </a>
    );
  }
  return null;
}
