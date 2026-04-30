import { redirect } from "next/navigation";
import {
  FREE_LEAD_LIMIT,
  FREE_SEARCHES_PER_DAY,
  PRO_SEARCHES_PER_DAY,
} from "@/lib/entitlements";
import { getCurrentUser } from "@/lib/session-user";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/onboarding");
  }
  if (user.onboardingComplete) {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl sm:p-8 dark:border-slate-800/80 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to LocalLeadster</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
          Free: <span className="font-medium text-slate-800 dark:text-slate-200">{FREE_LEAD_LIMIT}</span>{" "}
          new leads total (lifetime; deletes don&apos;t free slots) and{" "}
          <span className="font-medium text-slate-800 dark:text-slate-200">{FREE_SEARCHES_PER_DAY}</span>{" "}
          Google business searches per day (cached repeats don&apos;t count). Pro: unlimited
          lead saves, exports, and{" "}
          <span className="font-medium text-slate-800 dark:text-slate-200">{PRO_SEARCHES_PER_DAY}</span>{" "}
          searches per day. Tell us your profession so we can show the right tools.
        </p>
        <OnboardingForm currentProfession={user.profession} />
      </div>
    </div>
  );
}
