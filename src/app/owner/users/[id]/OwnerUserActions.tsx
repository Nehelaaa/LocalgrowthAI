"use client";

import { useTransition } from "react";
import { ownerDisableUser, ownerEnableUser, ownerSetPlan } from "@/actions/owner";

export function OwnerUserActions({
  userId,
  disabled,
  plan,
}: {
  userId: string;
  disabled: boolean;
  plan: "free" | "pro";
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {!disabled ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            start(async () => {
              await ownerDisableUser(userId);
            });
          }}
          className="min-h-11 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Disable user
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            start(async () => {
              await ownerEnableUser(userId);
            });
          }}
          className="min-h-11 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Enable user
        </button>
      )}

      {plan !== "pro" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            start(async () => {
              await ownerSetPlan(userId, "pro");
            });
          }}
          className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Upgrade to Pro
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            start(async () => {
              await ownerSetPlan(userId, "free");
            });
          }}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          Downgrade to Free
        </button>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          const r = await fetch("/api/owner/impersonate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });
          if (!r.ok) {
            const j = (await r.json().catch(() => null)) as { error?: string } | null;
            window.alert(j?.error ?? "Could not impersonate");
            return;
          }
          window.location.href = "/dashboard";
        }}
        className="min-h-11 rounded-xl border border-amber-300/80 bg-amber-50 px-4 text-sm font-semibold text-amber-900 disabled:opacity-50 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200"
      >
        Impersonate user
      </button>
    </div>
  );
}

