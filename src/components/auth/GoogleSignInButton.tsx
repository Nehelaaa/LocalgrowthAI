"use client";

import { useState } from "react";
import { getSession, signOut } from "next-auth/react";

/**
 * Auth.js forbids GET /api/auth/signin/:provider — it throws UnknownAction ("Unsupported action").
 * The built-in sign-in page submits a POST with csrfToken; we mirror that so navigation always works.
 */
function postOAuthSignIn(providerId: string, csrfToken: string, callbackUrl: string) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = `/api/auth/signin/${encodeURIComponent(providerId)}`;
  const csrf = document.createElement("input");
  csrf.type = "hidden";
  csrf.name = "csrfToken";
  csrf.value = csrfToken;
  const cb = document.createElement("input");
  cb.type = "hidden";
  cb.name = "callbackUrl";
  cb.value = callbackUrl;
  form.append(csrf, cb);
  document.body.appendChild(form);
  form.submit();
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type Props = {
  callbackUrl: string;
  label?: string;
  className?: string;
};

function normalizeRedirectTo(raw: string): string {
  const fallback = "/dashboard";
  if (!raw || typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const url = new URL(trimmed);
    if (typeof window !== "undefined" && url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export function GoogleSignInButton({
  callbackUrl,
  label = "Continue with Google",
  className = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** NextAuth v5 prefers redirectTo; callbackUrl still works but is deprecated on the client. */
  const redirectTo = normalizeRedirectTo(callbackUrl);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          void (async () => {
            setError(null);
            setLoading(true);
            try {
              // Only sign out when a session exists. Unconditional signOut adds a slow extra round-trip
              // before every Google sign-in (feels like a hang on slow networks).
              // getSession() uses fetch(); during Turbopack/HMR or a briefly-down API route it can throw
              // ClientFetchError — treat as "no session" so Google sign-in still runs.
              try {
                const session = await getSession();
                if (session?.user) {
                  try {
                    await signOut({ redirect: false });
                  } catch {
                    /* ignore */
                  }
                }
              } catch {
                /* ignore */
              }
              const csrfRes = await fetch("/api/auth/csrf", { credentials: "same-origin" });
              if (!csrfRes.ok) throw new Error("csrf");
              const { csrfToken } = (await csrfRes.json()) as { csrfToken?: string };
              if (!csrfToken) throw new Error("csrfToken");
              postOAuthSignIn("google", csrfToken, redirectTo);
            } catch (e) {
              console.error("Google sign-in failed:", e);
              setError(
                "Could not start Google sign-in. Check the browser console, confirm AUTH_URL matches this site, and that Google OAuth redirect URIs include /api/auth/callback/google."
              );
              setLoading(false);
            }
          })();
        }}
        className={
          "flex w-full min-h-[48px] items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700/80 " +
          className
        }
      >
        {loading ? (
          "…"
        ) : (
          <>
            <GoogleIcon className="h-5 w-5 shrink-0" />
            {label}
          </>
        )}
      </button>
      {error ? (
        <p className="text-center text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
