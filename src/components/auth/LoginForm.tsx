"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loginWithCredentials,
  type LoginCredentialsState,
} from "@/actions/login-credentials";
import { INVALID_CREDENTIALS } from "@/lib/auth-messages";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { GoogleSetupHint } from "./GoogleSetupHint";

const loginInit: LoginCredentialsState = {};

function oauthUrlErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "OAuthAccountNotLinked":
      return "This email is already registered (often with a password). Sign in with email + password, or use a different Google account. If you were signed in as someone else, we now reset the session before Google — try Continue with Google again.";
    case "Callback":
    case "OAuthCallback":
      return "Google could not complete sign-in (callback failed). Check Authorized redirect URIs and that AUTH_URL in .env matches the site you opened (host + port). See tips below.";
    case "OAuthSignin":
    case "OAuthCreateAccount":
      return "Google sign-in could not start. Confirm GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET and restart the dev server.";
    case "Configuration":
      return "Server auth check failed (often missing AUTH_SECRET on the host). In Vercel: Settings → Environment Variables — add AUTH_SECRET (run: openssl rand -base64 32), AUTH_URL as your exact live URL (https://…, no trailing slash), production DATABASE_URL, and Google OAuth keys; redeploy. In Google Cloud, add redirect URI https://YOUR_DOMAIN/api/auth/callback/google.";
    case "AccessDenied":
      return "Google denied access. If your OAuth consent screen is in Testing mode, open Google Cloud → OAuth consent screen → Test users, and add the exact Gmail you’re using.";
    case "Verification":
      return "Google is still verifying this app. Keep OAuth consent in Testing and add your Gmail under Test users.";
    default:
      return `Sign-in could not complete (code: ${code}). On localhost, confirm Google Cloud has redirect URI http://localhost:3000/api/auth/callback/google (exact match), then restart npm run dev.`;
  }
}

export function LoginForm({
  callbackUrl,
  hasGoogle,
  authError,
}: {
  callbackUrl: string;
  hasGoogle: boolean;
  authError?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    loginWithCredentials,
    loginInit
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordRef = useRef<HTMLInputElement>(null);

  // A rejected attempt should land the cursor on the field they need to retype.
  useEffect(() => {
    if (state?.error) passwordRef.current?.focus();
  }, [state]);

  const oauthMsg = oauthUrlErrorMessage(authError);

  // If NextAuth/Auth.js bounces back with ?error=..., clear it so the message doesn't
  // get stuck in the URL across refreshes or manual navigation.
  useEffect(() => {
    if (!authError) return;
    const sp = new URLSearchParams(searchParams?.toString());
    if (!sp.has("error")) return;
    sp.delete("error");
    const qs = sp.toString();
    // Replace the full URL (path + query) to avoid leaving a dangling "?" which can
    // keep app-router navigation in a weird intermediate state in some browsers.
    const nextUrl =
      typeof window !== "undefined"
        ? `${window.location.pathname}${qs ? `?${qs}` : ""}`
        : qs
          ? `?${qs}`
          : "/login";
    router.replace(nextUrl, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authError]);

  return (
    <div className="mt-6 space-y-5">
      {oauthMsg && (
        <p className="text-sm text-amber-800 dark:text-amber-200">{oauthMsg}</p>
      )}

      {!hasGoogle && <GoogleSetupHint />}

      <form className="space-y-4" action={formAction}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        {state?.error && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 dark:border-rose-900/60 dark:bg-rose-950/40"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-11a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 7Zm0 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-rose-800 dark:text-rose-200">
              {state.error === INVALID_CREDENTIALS ? (
                <>
                  <p className="font-semibold">Incorrect email or password</p>
                  <p className="mt-0.5 leading-relaxed">
                    Double-check both and try again
                    {hasGoogle
                      ? ", or use Continue with Google if that’s how you signed up."
                      : "."}{" "}
                    <Link
                      href="/forgot-password"
                      className="font-medium underline underline-offset-2"
                    >
                      Reset your password
                    </Link>
                    .
                  </p>
                </>
              ) : (
                <p>{state.error}</p>
              )}
            </div>
          </div>
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
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="email"
            required
            defaultValue={state?.email ?? ""}
            key={state?.email ?? "empty"}
            aria-invalid={state?.error ? true : undefined}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            ref={passwordRef}
            aria-invalid={state?.error ? true : undefined}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="lg-btn lg-btn-primary w-full"
        >
          {pending ? "Signing in…" : "Sign in with email"}
        </button>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          New here?{" "}
          <Link
            className="font-medium text-indigo-600 dark:text-indigo-400"
            href="/register"
          >
            Create an account
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
          <GoogleSignInButton callbackUrl={callbackUrl} />
          <p className="text-center text-xs text-slate-500 dark:text-slate-500">
            Recommended: one click, no password to remember.
          </p>
        </>
      )}
    </div>
  );
}
