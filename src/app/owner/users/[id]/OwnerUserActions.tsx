"use client";

import { useTransition } from "react";
import { ownerDisableUser, ownerEnableUser, ownerSetPlan, ownerSetRole } from "@/actions/owner";
import type { Role } from "@prisma/client";

export function OwnerUserActions({
  userId,
  disabled,
  plan,
  role,
}: {
  userId: string;
  disabled: boolean;
  plan: "free" | "pro";
  role: Role;
}) {
  const [pending, start] = useTransition();

  const btnBase =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:opacity-50 disabled:shadow-none";
  const btnSoft =
    btnBase +
    " border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800/70";
  const btnPrimary =
    btnBase +
    " bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400";
  const btnWarn =
    btnBase +
    " border border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100/70 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100 dark:hover:bg-amber-950/35";
  const btnDanger =
    btnBase +
    " bg-rose-600 text-white hover:bg-rose-500 dark:bg-rose-600 dark:hover:bg-rose-500";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
      {role !== "ADMIN" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Grant owner access (ADMIN) to this user?")) return;
            start(async () => {
              await ownerSetRole(userId, "ADMIN");
            });
          }}
          className={btnWarn}
        >
          Make owner
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Remove owner access (set role to USER) for this account?")) return;
            start(async () => {
              await ownerSetRole(userId, "USER");
            });
          }}
          className={btnSoft}
        >
          Remove owner
        </button>
      )}

      {!disabled ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            start(async () => {
              await ownerDisableUser(userId);
            });
          }}
          className={btnDanger}
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
          className={
            btnBase +
            " bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          }
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
          className={btnPrimary}
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
          className={btnSoft}
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
        className={btnSoft}
      >
        Impersonate user
      </button>
    </div>
  );
}

