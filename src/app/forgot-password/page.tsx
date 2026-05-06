import { AuthThemeCorner } from "@/components/theme/AuthThemeCorner";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-slate-100/90 p-4 dark:bg-slate-950">
      <AuthThemeCorner />
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
          <span className="bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 bg-clip-text text-lg font-bold text-transparent dark:from-violet-300 dark:via-indigo-300 dark:to-sky-300">
            LocalLeadster
          </span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
          Forgot password
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Enter your email and we&apos;ll send a link to reset your password (accounts that sign in
          only with Google don&apos;t use a password).
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
