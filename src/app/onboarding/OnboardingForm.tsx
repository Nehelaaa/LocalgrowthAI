"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  completeOnboarding,
  type OnboardingState,
} from "@/actions/onboarding";
import { BotTrapFields } from "@/components/forms/BotTrapFields";
import { SearchableCityState } from "@/app/dashboard/search/SearchableCityState";
import { BUSINESS_TYPES, hasDemoTemplateForType } from "@/lib/business-types";
import { PROFESSIONS, type ProfessionId } from "@/lib/profession";

const onboardingInitialState: OnboardingState = {};

const professionOrder = (Object.keys(PROFESSIONS) as ProfessionId[]).sort(
  (a, b) => PROFESSIONS[a].order - PROFESSIONS[b].order
);

/** Headline + supporting line per profession — full copy, not tooltip-only abbreviations. */
const PROFESSION_COPY: Record<ProfessionId, { title: string; hint: string }> = {
  web_agency: { title: "Web / local SEO", hint: "Sites, rankings, and retainers" },
  agency: { title: "Marketing agency", hint: "Ads, social, and creative work" },
  freelance: { title: "Freelancer", hint: "Solo, project by project" },
  sales: { title: "Sales / setter", hint: "Booking calls and closing deals" },
  real_estate: { title: "Real estate", hint: "Listings and local relationships" },
  trades: { title: "Trades", hint: "Electrical, plumbing, HVAC, contracting" },
  other: { title: "Something else", hint: "We'll keep it general" },
};

type Step = "profession" | "territory" | "payments";

export function OnboardingForm({
  currentProfession,
  currentCity,
  currentState,
  currentBusinessType,
  isPro,
  stripeConfigured,
  connectReady,
  connectBanner,
}: {
  currentProfession: string | null;
  currentCity: string | null;
  currentState: string | null;
  currentBusinessType: string | null;
  isPro: boolean;
  stripeConfigured: boolean;
  connectReady: boolean;
  connectBanner?: "return" | "refresh" | null;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const returningFromStripe =
    connectBanner === "return" || connectBanner === "refresh";

  const [step, setStep] = useState<Step>(
    returningFromStripe ? "payments" : "profession"
  );
  const [profession, setProfession] = useState(currentProfession ?? "");
  const [city, setCity] = useState(currentCity ?? "");
  const [state, setState] = useState(currentState ?? "");
  const [businessType, setBusinessType] = useState(currentBusinessType ?? "");
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectErr, setConnectErr] = useState<string | null>(null);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const [formState, action, pending] = useActionState(
    completeOnboarding,
    onboardingInitialState
  );

  useEffect(() => {
    if (formState?.success) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [formState?.success, router]);

  const showPaymentsStep = isPro || returningFromStripe;
  const steps: Step[] = useMemo(
    () =>
      showPaymentsStep
        ? ["profession", "territory", "payments"]
        : ["profession", "territory"],
    [showPaymentsStep]
  );
  const stepIndex = Math.max(0, steps.indexOf(step));

  function submitFinish() {
    setLocalErr(null);
    formRef.current?.requestSubmit();
  }

  /** City and state travel together — one without the other can't prefill a search. */
  function territoryIncomplete(): boolean {
    return (city.trim() !== "" && state.trim() === "") ||
      (state.trim() !== "" && city.trim() === "");
  }

  function continueFromTerritory() {
    if (territoryIncomplete()) {
      setLocalErr(
        city.trim()
          ? "Pick the state for that city so we can prefill your search."
          : "Add a city to go with that state, or clear both to skip."
      );
      return;
    }
    setLocalErr(null);
    if (showPaymentsStep) {
      setStep("payments");
      return;
    }
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

  const errorText = localErr ?? formState?.error ?? null;

  return (
    <div className="mt-7">
      <ProgressRail steps={steps} stepIndex={stepIndex} />

      {/* Values are submitted from this hidden form so every step shares one action. */}
      <form
        ref={formRef}
        action={action}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
      >
        <BotTrapFields />
        <input type="hidden" name="profession" value={profession} readOnly />
        <input type="hidden" name="targetCity" value={city} readOnly />
        <input type="hidden" name="targetState" value={state} readOnly />
        <input
          type="hidden"
          name="targetBusinessType"
          value={businessType}
          readOnly
        />
        <button type="submit" tabIndex={-1}>
          Finish
        </button>
      </form>

      {step === "profession" ? (
        <section className="lg-step-in mt-7 space-y-6" aria-labelledby="step-profession">
          <StepHeading
            id="step-profession"
            eyebrow="Your work"
            title="What kind of work do you do?"
            body="This tailors your dashboard and the tips you'll see. You can change it later in settings."
          />

          <div
            className="grid gap-2.5 sm:grid-cols-2"
            role="group"
            aria-label="Type of work"
          >
            {professionOrder.map((id) => {
              const copy = PROFESSION_COPY[id];
              const selected = profession === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setProfession(selected ? "" : id)}
                  className={
                    "lg-option" + (id === "other" ? " sm:col-span-2" : "")
                  }
                >
                  <span
                    className={
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition " +
                      (selected
                        ? "border-indigo-600 bg-indigo-600 dark:border-indigo-400 dark:bg-indigo-400"
                        : "border-slate-300 dark:border-slate-600")
                    }
                    aria-hidden
                  >
                    {selected ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                      {copy.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {copy.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              className="lg-btn lg-btn-primary w-full"
              onClick={() => {
                setLocalErr(null);
                setStep("territory");
              }}
            >
              Continue
            </button>
            <button
              type="button"
              className="lg-btn lg-btn-ghost w-full text-slate-500 dark:text-slate-400"
              onClick={() => {
                setProfession("");
                setLocalErr(null);
                setStep("territory");
              }}
            >
              Skip — I&apos;ll decide later
            </button>
          </div>
        </section>
      ) : null}

      {step === "territory" ? (
        <section className="lg-step-in mt-7 space-y-6" aria-labelledby="step-territory">
          <StepHeading
            id="step-territory"
            eyebrow="Your territory"
            title="Where do you want to prospect?"
            body="We'll load your first search with this, so you land on real businesses instead of an empty form."
          />

          <div className="space-y-4">
            <SearchableCityState
              city={city}
              setCity={setCity}
              state={state}
              setState={setState}
            />

            <div>
              <label
                htmlFor="onboarding-business-type"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Business type you sell to
              </label>
              <input
                id="onboarding-business-type"
                list="onboarding-business-types"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="e.g. hair salon"
                autoComplete="off"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />
              <datalist id="onboarding-business-types">
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              {hasDemoTemplateForType(businessType) ? (
                <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-violet-700 dark:text-violet-300">
                  <span aria-hidden>✦</span>
                  <span>
                    We have a demo-website template for {businessType.toLowerCase()} —
                    you can generate a live mockup site for any lead you save.
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          {errorText ? <ErrorNote>{errorText}</ErrorNote> : null}

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              disabled={pending}
              className="lg-btn lg-btn-primary w-full"
              onClick={continueFromTerritory}
            >
              {pending
                ? "Saving…"
                : showPaymentsStep
                  ? "Continue"
                  : "Start prospecting"}
            </button>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={pending}
                className="lg-btn lg-btn-secondary flex-1"
                onClick={() => {
                  setLocalErr(null);
                  setStep("profession");
                }}
              >
                Back
              </button>
              <button
                type="button"
                disabled={pending}
                className="lg-btn lg-btn-ghost flex-1 text-slate-500 dark:text-slate-400"
                onClick={() => {
                  setCity("");
                  setState("");
                  setBusinessType("");
                  setLocalErr(null);
                  if (showPaymentsStep) setStep("payments");
                  else submitFinish();
                }}
              >
                Skip
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {step === "payments" ? (
        <section className="lg-step-in mt-7 space-y-6" aria-labelledby="step-payments">
          {connectBanner === "return" ? (
            <p className="rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-sm text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100">
              {connectReady
                ? "Stripe is connected — you're ready to get paid on invoices."
                : "Thanks — finish any remaining Stripe steps later under Invoice payments."}
            </p>
          ) : null}
          {connectBanner === "refresh" ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              That Stripe link expired. Try Connect again, or skip and set it up
              later.
            </p>
          ) : null}

          <StepHeading
            id="step-payments"
            eyebrow="Payments · optional"
            title="Get paid on your invoices?"
            body="Connect Stripe once and clients can pay a shared invoice from their phone. Funds go straight to your account."
          />

          <ol className="overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-700">
            {[
              "Connect Stripe once",
              "Text or share an invoice link",
              "Client taps Pay — money lands with you",
            ].map((label, i) => (
              <li
                key={label}
                className="flex gap-3 border-b border-slate-100 bg-white px-4 py-3 last:border-b-0 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {i + 1}
                </span>
                <span className="self-center text-sm text-slate-700 dark:text-slate-300">
                  {label}
                </span>
              </li>
            ))}
          </ol>

          {connectErr ? <ErrorNote>{connectErr}</ErrorNote> : null}
          {errorText ? <ErrorNote>{errorText}</ErrorNote> : null}

          <div className="flex flex-col gap-2.5">
            {connectReady ? (
              <button
                type="button"
                disabled={pending}
                onClick={submitFinish}
                className="lg-btn lg-btn-primary w-full"
              >
                {pending ? "Saving…" : "Start prospecting"}
              </button>
            ) : isPro && stripeConfigured ? (
              <>
                <button
                  type="button"
                  disabled={connectBusy || pending}
                  onClick={() => void startStripeConnect()}
                  className="lg-btn lg-btn-primary w-full"
                >
                  {connectBusy ? "Opening Stripe…" : "Connect Stripe"}
                </button>
                <button
                  type="button"
                  disabled={pending || connectBusy}
                  onClick={submitFinish}
                  className="lg-btn lg-btn-secondary w-full"
                >
                  {pending ? "Saving…" : "Skip for now"}
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={submitFinish}
                className="lg-btn lg-btn-primary w-full"
              >
                {pending ? "Saving…" : "Start prospecting"}
              </button>
            )}

            <button
              type="button"
              disabled={pending || connectBusy}
              onClick={() => {
                setLocalErr(null);
                setStep("territory");
              }}
              className="lg-btn lg-btn-ghost w-full text-slate-500 dark:text-slate-400"
            >
              Back
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StepHeading({
  id,
  eyebrow,
  title,
  body,
}: {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 dark:text-white"
      >
        {title}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {body}
      </p>
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
    >
      {children}
    </p>
  );
}

function ProgressRail({
  steps,
  stepIndex,
}: {
  steps: Step[];
  stepIndex: number;
}) {
  const pct = ((stepIndex + 1) / steps.length) * 100;
  return (
    <div>
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
        Step {stepIndex + 1} of {steps.length}
      </p>
      <div
        className="lg-rail mt-2"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={stepIndex + 1}
        aria-label="Onboarding progress"
      >
        <div className="lg-rail-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
