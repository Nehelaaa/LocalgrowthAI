"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { GoogleSetupHint } from "./GoogleSetupHint";

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
      return "Server auth configuration error. Set AUTH_SECRET and AUTH_URL in .env, then restart.";
    case "AccessDenied":
      return "Google denied access. If your OAuth app is in Testing mode, add this Google account under Test users in Google Cloud.";
    default:
      return `Sign-in could not complete (code: ${code}). Check the terminal where the dev server runs for details, and the tips under Google sign-in.`;
  }
}

export function LoginForm({
  callbackUrl,
  hasGoogle,
  authError,
  ownerEmail,
}: {
  callbackUrl: string;
  hasGoogle: boolean;
  authError?: string | null;
  ownerEmail?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const oauthMsg = oauthUrlErrorMessage(authError);

  return (
    <div className="mt-6 space-y-5">
      {oauthMsg && (
        <p className="text-sm text-amber-800 dark:text-amber-200">{oauthMsg}</p>
      )}

      {!hasGoogle && <GoogleSetupHint />}

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          const fd = new FormData(e.currentTarget);
          const email = String(fd.get("email") ?? "");
          const password = String(fd.get("password") ?? "");
          const r = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          setLoading(false);
          if (r?.error) {
            setError(
              hasGoogle
                ? "Check email and password, or use Continue with Google below if that’s how you signed up."
                : "Check your email and password. To use Google, add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file."
            );
            return;
          }
          if (r?.ok) {
            const isOwner =
              ownerEmail &&
              ownerEmail.trim().length > 0 &&
              email.trim().toLowerCase() === ownerEmail.trim().toLowerCase();
            window.location.href = isOwner ? "/owner" : callbackUrl;
          }
        }}
      >
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
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
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in with email"}
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
