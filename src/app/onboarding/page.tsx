import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  FREE_LEAD_LIMIT,
  FREE_SEARCHES_LIFETIME,
  hasProEntitlement,
  PRO_SEARCHES_PER_DAY,
} from "@/lib/entitlements";
import { isStripeConfigured } from "@/lib/stripe";
import { syncConnectAccountFromStripe } from "@/lib/stripe-connect";
import { getCurrentUser } from "@/lib/session-user";
import { OnboardingForm } from "./OnboardingForm";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ connect?: string }>;
};

export default async function OnboardingPage({ searchParams }: Props) {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=" + encodeURIComponent("/onboarding"));
  }
  if (user.onboardingComplete) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const connectBanner =
    sp.connect === "return" || sp.connect === "refresh" ? sp.connect : null;

  if (connectBanner === "return" && user.stripeConnectAccountId) {
    await syncConnectAccountFromStripe(user.id);
  }

  const { prisma } = await import("@/lib/db");
  const fresh =
    (await prisma.user.findUnique({ where: { id: user.id } })) ?? user;

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-slate-100/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-slate-950">
      <div
        className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-20 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl dark:bg-teal-500/10"
        aria-hidden
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-sm sm:p-8 dark:border-slate-800/80 dark:bg-slate-900/95">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome to LocalLeadster
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-[15px] dark:text-slate-400">
          Find local businesses, build a pipeline, and send invoices — free to
          start.{" "}
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {FREE_LEAD_LIMIT} leads
          </span>{" "}
          and{" "}
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {FREE_SEARCHES_LIFETIME} searches
          </span>{" "}
          included. Pro unlocks unlimited leads,{" "}
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {PRO_SEARCHES_PER_DAY}/day
          </span>{" "}
          searches, and invoice Pay now.
        </p>
        <OnboardingForm
          currentProfession={fresh.profession}
          isPro={hasProEntitlement(fresh)}
          stripeConfigured={isStripeConfigured()}
          connectReady={Boolean(
            fresh.stripeConnectAccountId && fresh.stripeConnectChargesEnabled
          )}
          connectBanner={connectBanner}
        />
      </div>
    </div>
  );
}
