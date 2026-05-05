"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  ownerDeleteUser,
  ownerDisableUser,
  ownerEnableUser,
  ownerSetPlan,
  ownerSetRole,
} from "@/actions/owner";
import type { Role } from "@prisma/client";

/** Single-line toolbar: compact buttons, details in native tooltips. */
const bar =
  "flex max-w-full flex-nowrap items-center gap-1 overflow-x-auto rounded-lg border border-slate-200/90 bg-slate-50/70 px-1.5 py-1 dark:border-slate-600/90 dark:bg-slate-900/50";

const btn =
  "inline-flex shrink-0 items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 disabled:pointer-events-none disabled:opacity-40";

const ghost = `${btn} border border-slate-200/90 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700/80`;

const primary = `${btn} bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500`;

const warn = `${btn} border border-rose-200/90 bg-white text-rose-700 hover:bg-rose-50 dark:border-rose-900/45 dark:bg-rose-950/30 dark:text-rose-100 dark:hover:bg-rose-950/45`;

const destructive = `${btn} bg-rose-600 text-white hover:bg-rose-500`;

function Divider() {
  return <span className="shrink-0 self-stretch border-l border-slate-200/90 dark:border-slate-600" aria-hidden />;
}

export function OwnerUserActions({
  userId,
  currentUserId,
  disabled,
  plan,
  role,
  stripeSubscriptionId,
}: {
  userId: string;
  currentUserId: string;
  disabled: boolean;
  plan: "free" | "pro";
  role: Role;
  stripeSubscriptionId: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const canDelete =
    disabled &&
    role !== "ADMIN" &&
    userId !== currentUserId &&
    !stripeSubscriptionId;

  const showDeleteSlot = disabled && role !== "ADMIN" && userId !== currentUserId;

  return (
    <nav className={bar} aria-label="Admin actions">
      {plan !== "pro" ? (
        <button
          type="button"
          disabled={pending}
          title="Set plan to Pro in the database (support / comp — billing is usually via Stripe checkout)."
          onClick={() => {
            start(async () => {
              await ownerSetPlan(userId, "pro");
              router.refresh();
            });
          }}
          className={primary}
        >
          Pro
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          title="Set plan to Free in the database."
          onClick={() => {
            start(async () => {
              await ownerSetPlan(userId, "free");
              router.refresh();
            });
          }}
          className={ghost}
        >
          Free
        </button>
      )}

      {role !== "ADMIN" ? (
        <button
          type="button"
          disabled={pending}
          title="Grant ADMIN (owner console access)."
          onClick={() => {
            if (!window.confirm("Grant owner (ADMIN) access?")) return;
            start(async () => {
              await ownerSetRole(userId, "ADMIN");
              router.refresh();
            });
          }}
          className={ghost}
        >
          Make owner
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          title="Remove owner access (USER)."
          onClick={() => {
            if (!window.confirm("Remove owner (USER)?")) return;
            start(async () => {
              await ownerSetRole(userId, "USER");
              router.refresh();
            });
          }}
          className={ghost}
        >
          Drop owner
        </button>
      )}

      {!disabled ? (
        <button
          type="button"
          disabled={pending}
          title="Block sign-in without deleting data."
          onClick={() => {
            if (!window.confirm("Disable this user?")) return;
            start(async () => {
              await ownerDisableUser(userId);
              router.refresh();
            });
          }}
          className={warn}
        >
          Disable
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          title="Allow sign-in again."
          onClick={() => {
            start(async () => {
              await ownerEnableUser(userId);
              router.refresh();
            });
          }}
          className={ghost}
        >
          Enable
        </button>
      )}

      <button
        type="button"
        disabled={pending}
        title="Open the app as this user."
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
        className={ghost}
      >
        Impersonate
      </button>

      {showDeleteSlot ? (
        <>
          <Divider />
          <button
            type="button"
            disabled={pending || !canDelete}
            title={
              canDelete
                ? "Permanently delete this user (disabled, no Stripe subscription id). Cannot undo."
                : stripeSubscriptionId
                  ? "Cancel Stripe subscription in Billing first."
                  : "Cannot delete."
            }
            onClick={() => {
              if (!window.confirm("Permanently delete this user and their data?")) return;
              start(async () => {
                try {
                  await ownerDeleteUser(userId);
                  router.push("/owner/users");
                  router.refresh();
                } catch (e) {
                  window.alert(e instanceof Error ? e.message : "Delete failed");
                }
              });
            }}
            className={destructive}
          >
            Delete
          </button>
        </>
      ) : null}
    </nav>
  );
}
