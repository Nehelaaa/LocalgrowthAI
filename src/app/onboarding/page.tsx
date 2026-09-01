import Image from "next/image";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { BRAND_WORDMARK_LG } from "@/lib/brand-wordmark";
import {
  FREE_LEAD_LIMIT,
  FREE_SEARCHES_LIFETIME,
  hasProEntitlement,
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
  const isPro = hasProEntitlement(fresh);

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-slate-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-slate-950">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-20%,rgba(79,70,229,0.14),transparent)]"
        aria-hidden
      />

      <main className="lg-card relative z-10 w-full max-w-xl p-6 sm:p-8">
        <div className="flex items-center gap-2.5">
          <Image
            src="/favicon.svg"
            alt=""
            width={34}
            height={34}
            className="h-[34px] w-[34px] rounded-lg shadow-sm"
            priority
          />
          <span className={BRAND_WORDMARK_LG}>LocalLeadster</span>
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.7rem] dark:text-white">
          Let&apos;s set up your workspace
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {isPro ? (
            <>Three short steps and you&apos;re prospecting.</>
          ) : (
            <>
              Two short steps and you&apos;re prospecting. Your free plan includes{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                {FREE_LEAD_LIMIT} saved leads
              </strong>{" "}
              and{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                {FREE_SEARCHES_LIFETIME} live searches
              </strong>
              .
            </>
          )}
        </p>

        <OnboardingForm
          currentProfession={fresh.profession}
          currentCity={fresh.targetCity}
          currentState={fresh.targetState}
          currentBusinessType={fresh.targetBusinessType}
          isPro={isPro}
          stripeConfigured={isStripeConfigured()}
          connectReady={Boolean(
            fresh.stripeConnectAccountId && fresh.stripeConnectChargesEnabled
          )}
          connectBanner={connectBanner}
        />
      </main>
    </div>
  );
}
