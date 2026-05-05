"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";

const bar =
  "flex max-w-full flex-nowrap items-center gap-1 overflow-x-auto rounded-lg border border-slate-200/90 bg-slate-50/70 px-1.5 py-1 dark:border-slate-600/90 dark:bg-slate-900/50";

const btn =
  "inline-flex shrink-0 items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 disabled:pointer-events-none disabled:opacity-40";

const ghost = `${btn} border border-slate-200/90 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700/80`;

const primary = `${btn} bg-indigo-600 text-white hover:bg-indigo-500`;

const warn = `${btn} border border-rose-200/90 bg-white text-rose-800 hover:bg-rose-50 dark:border-rose-900/45 dark:bg-rose-950/30 dark:text-rose-100 dark:hover:bg-rose-950/45`;

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
  const router = useRouter();
  const [pending, start] = useTransition();

  const canUseStripe = stripeConfigured && Boolean(stripeCustomerId);
  const canCancelSubscription = canUseStripe && Boolean(stripeSubscriptionId);
  const canRefund = canUseStripe;

  const subHint = useMemo(() => {
    if (!stripeConfigured) return "Stripe keys not configured.";
    if (!stripeCustomerId) return "No Stripe customer linked.";
    if (!stripeSubscriptionId) return "No subscription id on file.";
    return null;
  }, [stripeConfigured, stripeCustomerId, stripeSubscriptionId]);

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700/90 dark:bg-slate-900/85 dark:ring-white/[0.05] sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0 shrink">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Billing (Stripe)</h2>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {subscriptionStatus ? (
              <>
                DB: <span className="font-medium text-slate-700 dark:text-slate-300">{subscriptionStatus}</span>
                {" · "}
              </>
            ) : null}
            {subHint ?? "Ready."}
          </p>
        </div>
        <nav className={bar} aria-label="Stripe billing actions">
          <button
            type="button"
            disabled={pending || !canCancelSubscription}
            title="Cancel at period end — customer keeps access until period ends."
            onClick={() => {
              if (!window.confirm("Cancel at period end?")) return;
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
                router.refresh();
              });
            }}
            className={ghost}
          >
            End at period
          </button>
          <button
            type="button"
            disabled={pending || !canCancelSubscription}
            title="Cancel subscription immediately in Stripe."
            onClick={() => {
              if (!window.confirm("Cancel subscription immediately?")) return;
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
                router.refresh();
              });
            }}
            className={warn}
          >
            Cancel now
          </button>
          <button
            type="button"
            disabled={pending || !canRefund}
            title="Refund the most recent paid charge (best-effort)."
            onClick={() => {
              if (!window.confirm("Refund the most recent paid charge?")) return;
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
                router.refresh();
              });
            }}
            className={primary}
          >
            Refund
          </button>
        </nav>
      </div>
    </section>
  );
}
