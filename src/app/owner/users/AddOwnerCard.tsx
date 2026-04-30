"use client";

import { useState, useTransition } from "react";
import { ownerAddOwnerByEmail } from "@/actions/owner";

export function AddOwnerCard() {
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Add owner access</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Promote an account to Owner (ADMIN). If the user doesn’t exist yet, we’ll create it and send a
        password set link.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@company.com"
          type="email"
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <button
          type="button"
          disabled={pending || email.trim().length === 0}
          onClick={() => {
            setStatus(null);
            start(async () => {
              try {
                await ownerAddOwnerByEmail(email);
                setStatus("Owner added. If email is configured, a password link was sent.");
                setEmail("");
              } catch (e) {
                setStatus(e instanceof Error ? e.message : "Could not add owner.");
              }
            });
          }}
          className="min-h-11 shrink-0 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Add owner
        </button>
      </div>

      {status && (
        <p className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-300" role="status">
          {status}
        </p>
      )}
    </div>
  );
}

