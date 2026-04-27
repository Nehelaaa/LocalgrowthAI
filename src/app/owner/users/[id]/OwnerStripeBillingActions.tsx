"use client";

import { useMemo, useTransition } from "react";

export function OwnerStripeBillingActions({
  userId,
  stripeConfigured,
  stripeCustomerId,
  stripeSubscriptionId,
  subscriptionStatus,
}: {
  userId: string;
  stripeConfigured: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
}) {
  const [pending, start] = useTransition();

  const canUseStripe = stripeConfigured && Boolean(stripeCustomerId);
  const canCancelSubscription = canUseStripe && Boolean(stripeSubscriptionId);
  const canRefund = canUseStripe;

  const subHint = useMemo(() => {
    if (!stripeConfigured) return "Stripe is not configured on the server.";
    if (!stripeCustomerId) return "No Stripe customer is linked yet.";
    if (!stripeSubscriptionId) return "No Stripe subscription id on file (user may be free / comped).";
    return null;
  }, [stripeConfigured, stripeCustomerId, stripeSubscriptionId]);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Billing ops (Stripe)
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-world support flows: failed renewals, cancellations, refunds, and disputes. These actions
            hit Stripe directly and should be used carefully.
          </p>
          {subscriptionStatus ? (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              Stripe status on file:{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{subscriptionStatus}</span>
            </p>
          ) : null}
          {subHint ? (
            <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">{subHint}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={pending || !canCancelSubscription}
          onClick={() => {
            if (!window.confirm("Cancel at period end? The customer keeps access until the period ends.")) {
              return;
            }
            start(async () => {
              const r = await fetch("/api/owner/stripe/subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, mode: "cancel_at_period_end" }),
              });
              const j = (await r.json().catch(() => null)) as { error?: string } | null;
              if (!r.ok) {
                window.alert(j?.error ?? "Request failed");
                return;
              }
              window.location.reload();
            });
          }}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          Cancel at period end
        </button>

        <button
          type="button"
          disabled={pending || !canCancelSubscription}
          onClick={() => {
            if (
              !window.confirm(
                "Cancel immediately? This revokes Pro access now (per your Stripe subscription cancel)."
              )
            ) {
              return;
            }
            start(async () => {
              const r = await fetch("/api/owner/stripe/subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, mode: "cancel_now" }),
              });
              const j = (await r.json().catch(() => null)) as { error?: string } | null;
              if (!r.ok) {
                window.alert(j?.error ?? "Request failed");
                return;
              }
              window.location.reload();
            });
          }}
          className="min-h-11 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Cancel subscription now
        </button>

        <button
          type="button"
          disabled={pending || !canRefund}
          onClick={() => {
            if (
              !window.confirm(
                "Refund the most recent paid charge for this customer? (Best-effort: first non-refunded charge.)"
              )
            ) {
              return;
            }
            start(async () => {
              const r = await fetch("/api/owner/stripe/refund-last-charge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
              });
              const j = (await r.json().catch(() => null)) as { error?: string } | null;
              if (!r.ok) {
                window.alert(j?.error ?? "Request failed");
                return;
              }
              window.location.reload();
            });
          }}
          className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Refund last paid charge
        </button>
      </div>
    </div>
  );
}
