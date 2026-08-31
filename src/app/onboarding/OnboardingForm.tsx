"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  completeOnboarding,
  type OnboardingState,
} from "@/actions/onboarding";
import { BotTrapFields } from "@/components/forms/BotTrapFields";
import { PROFESSIONS, type ProfessionId } from "@/lib/profession";

const onboardingInitialState: OnboardingState = {};

const order = (Object.keys(PROFESSIONS) as ProfessionId[]).sort(
  (a, b) => PROFESSIONS[a].order - PROFESSIONS[b].order
);

/** Short chip labels — full copy stays in PROFESSIONS for storage/display elsewhere. */
const PROFESSION_CHIP: Record<ProfessionId, string> = {
  web_agency: "Web / SEO",
  real_estate: "Real estate",
  trades: "Trades",
  sales: "Sales",
  freelance: "Freelance",
  agency: "Agency",
  other: "Other",
};

type Step = "profession" | "payments";

export function OnboardingForm({
  currentProfession,
  isPro,
  stripeConfigured,
  connectReady,
  connectBanner,
}: {
  currentProfession: string | null;
  isPro: boolean;
  stripeConfigured: boolean;
  connectReady: boolean;
  connectBanner?: "return" | "refresh" | null;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<Step>(
    connectBanner === "return" || connectBanner === "refresh"
      ? "payments"
      : "profession"
  );
  const [profession, setProfession] = useState(currentProfession ?? "");
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectErr, setConnectErr] = useState<string | null>(null);
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

  function submitFinish() {
    formRef.current?.requestSubmit();
  }

  function continueFromProfession() {
    if (isPro) {
      setStep("payments");
      return;
    }
    // Free users: finish after profession — get them to first search faster.
    submitFinish();
  }

  async function startStripeConnect() {
    setConnectErr(null);
    setConnectBusy(true);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "onboard", returnTo: "onboarding" }),
      });
      const data = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Could not open Stripe.");
      }
      window.location.href = data.url;
    } catch (e) {
      setConnectErr(e instanceof Error ? e.message : "Could not open Stripe.");
      setConnectBusy(false);
    }
  }

  const showPaymentsStep = isPro || Boolean(connectBanner);

  return (
    <div className="mt-6">
      <StepIndicator step={step} showPayments={showPaymentsStep} />

      <form
        ref={formRef}
        action={action}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
      >
        <BotTrapFields />
        <input type="hidden" name="profession" value={profession} readOnly />
        <button type="submit">Finish</button>
      </form>

      {step === "profession" ? (
        <div className="mt-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              What do you do?
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Optional — we tailor tips later. Tap one or skip.
            </p>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Profession"
          >
            <button
              type="button"
              onClick={() => setProfession("")}
              className={
                "min-h-11 rounded-xl border px-3.5 py-2 text-sm font-medium transition touch-manipulation " +
                (profession === ""
                  ? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500")
              }
            >
              Skip for now
            </button>
            {order.map((id) => {
              const selected = profession === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setProfession(id)}
                  title={PROFESSIONS[id].label}
                  className={
                    "min-h-11 rounded-xl border px-3.5 py-2 text-sm font-medium transition touch-manipulation " +
                    (selected
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-100"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500")
                  }
                >
                  {PROFESSION_CHIP[id]}
                </button>
              );
            })}
          </div>

          {state?.error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{state.error}</p>
          ) : null}

          <button
            type="button"
            disabled={pending}
            onClick={continueFromProfession}
            className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 touch-manipulation"
          >
            {pending
              ? "Saving…"
              : isPro
                ? "Continue"
                : "Go to dashboard"}
          </button>

          {!isPro ? (
            <p className="text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Next up: find local businesses. Invoice Pay now is on Pro — connect
              Stripe anytime under Invoice payments after you upgrade.
            </p>
          ) : (
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Next: optional Stripe Connect so clients can pay invoices.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {connectBanner === "return" ? (
            <p className="rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-sm text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100">
              {connectReady
                ? "Stripe is connected — you’re ready to get paid on invoices."
                : "Thanks — finish any remaining Stripe steps later under Invoice payments."}
            </p>
          ) : null}
          {connectBanner === "refresh" ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              That Stripe link expired. Try Connect again, or skip and set it up
              later.
            </p>
          ) : null}

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
              Optional
            </p>
            <h2 className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-white">
              Get paid on invoices?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Share a branded invoice from a lead. Clients tap{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                Pay
              </strong>{" "}
              — funds go to your Stripe.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white dark:border-slate-700 dark:from-slate-800/80 dark:to-slate-900">
            <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
              {[
                "Connect Stripe once",
                "Text or share an invoice link",
                "Client pays — money to you",
              ].map((label, i) => (
                <li key={label} className="flex gap-3 px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-xs font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-200">
                    {i + 1}
                  </span>
                  <span className="self-center text-slate-700 dark:text-slate-300">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {connectErr ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{connectErr}</p>
          ) : null}
          {state?.error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{state.error}</p>
          ) : null}

          <div className="flex flex-col gap-2.5">
            {connectReady ? (
              <button
                type="button"
                disabled={pending}
                onClick={submitFinish}
                className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 touch-manipulation"
              >
                {pending ? "Saving…" : "Go to dashboard"}
              </button>
            ) : isPro && stripeConfigured ? (
              <>
                <button
                  type="button"
                  disabled={connectBusy || pending}
                  onClick={() => void startStripeConnect()}
                  className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 touch-manipulation"
                >
                  {connectBusy ? "Opening Stripe…" : "Connect Stripe"}
                </button>
                <button
                  type="button"
                  disabled={pending || connectBusy}
                  onClick={submitFinish}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 touch-manipulation"
                >
                  {pending ? "Saving…" : "Skip for now"}
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={submitFinish}
                className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 touch-manipulation"
              >
                {pending ? "Saving…" : "Continue to dashboard"}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setStep("profession")}
            className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}

function StepIndicator({
  step,
  showPayments,
}: {
  step: Step;
  showPayments: boolean;
}) {
  if (!showPayments) {
    return (
      <div className="flex items-center gap-2" aria-label="Onboarding progress">
        <span className="flex h-8 flex-1 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white shadow-sm">
          Welcome
        </span>
      </div>
    );
  }

  const onPayments = step === "payments";
  return (
    <div className="flex items-center gap-2" aria-label="Onboarding progress">
      <span
        className={
          "flex h-8 flex-1 items-center justify-center rounded-full text-xs font-semibold transition " +
          (!onPayments
            ? "bg-indigo-600 text-white shadow-sm"
            : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200")
        }
      >
        1 · You
      </span>
      <span className="text-slate-300 dark:text-slate-600" aria-hidden>
        →
      </span>
      <span
        className={
          "flex h-8 flex-1 items-center justify-center rounded-full text-xs font-semibold transition " +
          (onPayments
            ? "bg-teal-600 text-white shadow-sm"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")
        }
      >
        2 · Payments
      </span>
    </div>
  );
}
