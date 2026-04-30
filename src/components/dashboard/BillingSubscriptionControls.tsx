"use client";

import { ManageBillingButton } from "@/components/dashboard/ManageBillingButton";

export type BillingControlsMode =
  | "starter"
  | "stripe_subscriber"
  | "pro_not_billed"
  | "pro_legacy";

/**
 * Starter upgrades live in the plan card — no duplicate block.
 * Stripe subscribers get one portal entry point (card, invoices, plan changes live in Stripe).
 */
export function BillingSubscriptionControls({ mode }: { mode: BillingControlsMode }) {
  if (mode === "starter" || mode === "pro_legacy") {
    return null;
  }

  if (mode === "pro_not_billed") {
    return (
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        This account has Pro access without an active Stripe subscription, so the billing portal is not
        available here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <p className="max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Update your card, download invoices, change your plan, or cancel—all in Stripe&apos;s customer
        portal. What you see there depends on your workspace&apos;s Stripe configuration.
      </p>
      <ManageBillingButton
        variant="primary"
        className="w-full shrink-0 justify-center px-6 py-3 sm:w-auto sm:min-w-[200px]"
        label="Open billing portal"
      />
    </div>
  );
}
