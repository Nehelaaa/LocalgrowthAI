import { redirect } from "next/navigation";
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to LocalGrowth</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
          Free: up to 10 saved leads and{" "}
          <span className="font-medium text-slate-800 dark:text-slate-200">20</span> Google
          business searches per day (cached repeat searches don&apos;t count). Pro: unlimited
          leads, exports, and{" "}
          <span className="font-medium text-slate-800 dark:text-slate-200">100</span> searches
          per day. Tell us your profession so we can show the right tools.
        </p>
        <OnboardingForm currentProfession={user.profession} />
      </div>
    </div>
  );
}
