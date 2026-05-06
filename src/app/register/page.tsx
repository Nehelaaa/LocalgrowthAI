import { AuthThemeCorner } from "@/components/theme/AuthThemeCorner";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { isGoogleOAuthConfigured } from "@/lib/google-oauth";
import { postLoginContinueUrl } from "@/lib/post-login-continue";
import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { BRAND_WORDMARK_LG } from "@/lib/brand-wordmark";
import { publicPageMetadata } from "@/lib/seo/public-page-metadata";

export const metadata: Metadata = publicPageMetadata({
  pathname: "/register",
  title: "Create your free LocalLeadster account",
  ogTitle: "Sign up — LocalLeadster",
  description:
    "Start free: Google Places territory prospecting, lead scoring, CRM pipeline with follow-ups, and branded PDF invoices when you upgrade to Pro.",
  keywords: [
    "LocalLeadster sign up",
    "local lead generation free trial",
    "Google Places CRM",
    "create LocalLeadster account",
  ],
});

export default function RegisterPage() {
  const hasGoogle = isGoogleOAuthConfigured();
  const googleAfterAuthUrl = postLoginContinueUrl("/onboarding");
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-slate-100/90 p-4 dark:bg-slate-950">
      <AuthThemeCorner />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(99,102,241,0.18),transparent)] dark:bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(99,102,241,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-lg overflow-x-clip overflow-y-visible rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-800/80 dark:bg-slate-900">
        <div className="border-b border-slate-200/70 bg-gradient-to-b from-white to-slate-50/60 p-7 dark:border-slate-800/70 dark:from-slate-900 dark:to-slate-900/60">
          <div className="flex items-center gap-2 overflow-visible">
          <Image
            src="/favicon.svg"
            alt="LocalLeadster"
            className="h-9 w-9 shrink-0 rounded-xl shadow-md"
            width={36}
            height={36}
            priority
          />
          <span className={BRAND_WORDMARK_LG}>LocalLeadster</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create an account
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Get a clean pipeline for local prospects — search, qualify, and track follow-ups in one place.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
            {[
              "Find businesses fast",
              "Score + badge leads",
              "Track contact status",
              "Export when ready",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.57a1 1 0 0 1-1.424 0L3.296 9.71A1 1 0 1 1 4.72 8.29l3.0 3.028 6.786-6.85a1 1 0 0 1 1.414-.006Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="min-w-0 truncate">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-7">
          <RegisterForm hasGoogle={hasGoogle} googleAfterAuthUrl={googleAfterAuthUrl} />
          <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-400">
            <Link className="font-medium text-indigo-600 hover:underline dark:text-indigo-400" href="/login">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
