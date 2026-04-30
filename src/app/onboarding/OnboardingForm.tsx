"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import {
  completeOnboarding,
  type OnboardingState,
} from "@/actions/onboarding";

const onboardingInitialState: OnboardingState = {};
import { PROFESSIONS, type ProfessionId } from "@/lib/profession";

const order = (Object.keys(PROFESSIONS) as ProfessionId[]).sort(
  (a, b) => PROFESSIONS[a].order - PROFESSIONS[b].order
);

export function OnboardingForm({
  currentProfession,
}: {
  currentProfession: string | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    completeOnboarding,
    onboardingInitialState
  );

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state?.success, router]);

  return (
    <form action={action} className="mt-6 space-y-5">
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <div>
        <label
          htmlFor="onboarding-profession"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          What do you do?
        </label>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Optional. Helps us understand your use-case (doesn’t change the dashboard).
        </p>
        <select
          id="onboarding-profession"
          name="profession"
          defaultValue={currentProfession ?? ""}
          className="mt-2 w-full min-h-[48px] appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          <option value="">Skip for now</option>
          {order.map((id) => (
            <option key={id} value={id}>
              {PROFESSIONS[id].label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 touch-manipulation"
      >
        {pending ? "Saving…" : "Continue to dashboard"}
      </button>
    </form>
  );
}
