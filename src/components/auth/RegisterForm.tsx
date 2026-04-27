"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { registerUser, type RegisterState } from "@/actions/register";
import { PROFESSIONS, type ProfessionId } from "@/lib/profession";

const professionOrder = (Object.keys(PROFESSIONS) as ProfessionId[]).sort(
  (a, b) => PROFESSIONS[a].order - PROFESSIONS[b].order
);
import { GoogleSignInButton } from "./GoogleSignInButton";
import { GoogleSetupHint } from "./GoogleSetupHint";

const init: RegisterState = {};

export function RegisterForm({ hasGoogle }: { hasGoogle: boolean }) {
  const [state, action, pending] = useActionState(registerUser, init);
  const router = useRouter();
  const signed = useRef(false);

  useEffect(() => {
    if (!state?.success || signed.current) return;
    const form = document.getElementById("register-form") as HTMLFormElement;
    if (!form) return;
    const email = (form.querySelector('input[name="email"]') as HTMLInputElement)?.value;
    const password = (form.querySelector('input[name="password"]') as HTMLInputElement)?.value;
    if (!email || !password) return;
    signed.current = true;
    void (async () => {
      const r = await signIn("credentials", { email, password, redirect: false });
      if (r?.ok) {
        router.push("/onboarding");
        router.refresh();
      } else {
        window.location.href = "/login?registered=1";
      }
    })();
  }, [state?.success, router]);

  if (state?.success) {
    return (
      <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">Signing you in…</p>
    );
  }

  return (
    <div className="mt-6 space-y-5">
      {!hasGoogle && <GoogleSetupHint />}

      <form id="register-form" className="space-y-4" action={action}>
        {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {state?.fieldErrors?.name && (
            <p className="mt-0.5 text-xs text-red-500">{state.fieldErrors.name}</p>
          )}
        </div>
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
          {state?.fieldErrors?.email && (
            <p className="mt-0.5 text-xs text-red-500">{state.fieldErrors.email}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="profession"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Profession
          </label>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            We customize your dashboard and mobile experience for your work.
          </p>
          <select
            id="profession"
            name="profession"
            required
            defaultValue="web_agency"
            className="mt-1 w-full min-h-[48px] appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {professionOrder.map((id) => (
              <option key={id} value={id}>
                {PROFESSIONS[id].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Password
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
          {state?.fieldErrors?.password && (
            <p className="mt-0.5 text-xs text-red-500">{state.fieldErrors.password}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create account"}
        </button>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link className="font-medium text-indigo-600 dark:text-indigo-400" href="/login">
            Sign in
          </Link>
        </p>
      </form>

      {hasGoogle && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs font-medium uppercase tracking-wide text-slate-500">
              <span className="bg-white px-2 dark:bg-slate-900">or</span>
            </div>
          </div>
          <GoogleSignInButton callbackUrl="/onboarding" label="Sign up with Google" />
          <p className="text-center text-xs text-slate-500">Fastest way to get started.</p>
        </>
      )}
    </div>
  );
}
