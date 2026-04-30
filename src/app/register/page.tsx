import { RegisterForm } from "@/components/auth/RegisterForm";
import { isGoogleOAuthConfigured } from "@/lib/google-oauth";
import { FREE_LEAD_LIMIT } from "@/lib/entitlements";
import Link from "next/link";

export default function RegisterPage() {
  const hasGoogle = isGoogleOAuthConfigured();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100/90 p-4 dark:bg-slate-950">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(99,102,241,0.18),transparent)] dark:bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(99,102,241,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white">
            L
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">LocalGrowth AI</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Create an account</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Free tier includes {FREE_LEAD_LIMIT} new leads total (lifetime; removing a lead does not
          free a slot). Upgrade in-app for AI, exports, and unlimited saves.
        </p>
        <RegisterForm hasGoogle={hasGoogle} />
        <p className="mt-4 text-center text-xs text-slate-500">
          By signing up you agree to our fair use of search and AI features. For production, keep API
          keys on the server in <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env</code>.
        </p>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          <Link className="font-medium text-indigo-600 dark:text-indigo-400" href="/login">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
