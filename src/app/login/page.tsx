import { LoginForm } from "@/components/auth/LoginForm";
import { isGoogleOAuthConfigured } from "@/lib/google-oauth";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

type Search = Promise<{
  callbackUrl?: string;
  registered?: string;
  error?: string;
  reset?: string;
}>;

export default async function LoginPage({ searchParams }: { searchParams: Search }) {
  const q = await searchParams;
  const callbackUrl = typeof q.callbackUrl === "string" ? q.callbackUrl : "/dashboard";
  const authError = typeof q.error === "string" ? q.error : null;
  const ownerEmail = process.env.OWNER_EMAIL ?? null;
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100/90 p-4 dark:bg-slate-950">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(99,102,241,0.18),transparent)] dark:bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(99,102,241,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Image
            src="/favicon.svg"
            alt="LocalLeadster"
            className="h-9 w-9 rounded-xl shadow-md"
            width={36}
            height={36}
            priority
          />
          <span className="text-lg font-bold text-slate-900 dark:text-white">LocalLeadster</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Sign in</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Access your lead pipeline, searches, and CRM in one place.
        </p>
        {q.registered === "1" && (
          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
            Account created — sign in below.
          </p>
        )}
        {q.reset === "1" && (
          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
            Password updated — you can sign in with your new password.
          </p>
        )}
        <LoginForm
          callbackUrl={callbackUrl}
          hasGoogle={isGoogleOAuthConfigured()}
          authError={authError}
          ownerEmail={ownerEmail}
        />
      </div>
    </div>
  );
}
