"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  resetPasswordWithToken,
  type ResetPasswordState,
} from "@/actions/password-reset";
import { BotTrapFields } from "@/components/forms/BotTrapFields";

const init: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(resetPasswordWithToken, init);

  useEffect(() => {
    if (state.ok) {
      router.replace("/login?reset=1");
    }
  }, [state.ok, router]);

  if (!token) {
    return (
      <p className="mt-6 text-sm text-red-600 dark:text-red-400">
        Missing reset token. Open the link from your email or request a new reset from{" "}
        <Link href="/forgot-password" className="font-medium text-indigo-600 underline">
          Forgot password
        </Link>
        .
      </p>
    );
  }

  return (
    <form action={action} className="relative mt-6 space-y-4">
      <BotTrapFields />
      <input type="hidden" name="token" value={token} />
      {(state.error || state.fieldErrors) && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.error ?? state.fieldErrors?.password ?? state.fieldErrors?.confirm}
        </p>
      )}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>
      <div>
        <label
          htmlFor="confirm"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>
      <button
        type="submit"
        disabled={pending || state.ok}
        className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Update password"}
      </button>
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        <Link className="font-medium text-indigo-600 dark:text-indigo-400" href="/login">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
