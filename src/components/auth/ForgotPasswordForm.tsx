"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  requestPasswordReset,
  type ForgotPasswordState,
} from "@/actions/password-reset";

const init: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, init);

  if (state.ok) {
    return (
      <div className="mt-6 space-y-4">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          If an account with that email exists and uses a password, we sent reset instructions.
          Check your inbox (and spam).
        </p>
        {state.devLogged && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            Dev mode: the reset URL was printed in the terminal running{" "}
            <code className="rounded bg-white/80 px-1 dark:bg-slate-900">npm run dev</code>.
          </p>
        )}
        <p className="text-center text-sm">
          <Link
            className="font-medium text-indigo-600 dark:text-indigo-400"
            href="/login"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        <Link className="font-medium text-indigo-600 dark:text-indigo-400" href="/login">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
