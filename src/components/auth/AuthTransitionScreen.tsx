import Image from "next/image";
import { BRAND_WORDMARK_LG } from "@/lib/brand-wordmark";

type Props = {
  message?: string;
  submessage?: string;
};

export function AuthTransitionScreen({
  message = "Signing you in…",
  submessage = "One moment while we open your workspace.",
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[200] flex min-h-[100dvh] flex-col items-center justify-center bg-slate-100/95 p-6 dark:bg-slate-950/98"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(99,102,241,0.18),transparent)] dark:bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(99,102,241,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative flex flex-col items-center text-center">
        <div className="flex items-center gap-2.5">
          <Image
            src="/favicon.svg"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-xl shadow-md"
            priority
          />
          <span className={BRAND_WORDMARK_LG}>LocalLeadster</span>
        </div>
        <div
          className="mt-8 h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600 dark:border-indigo-500/30 dark:border-t-indigo-400"
          aria-hidden
        />
        <p className="mt-6 text-base font-semibold text-slate-900 dark:text-white">{message}</p>
        <p className="mt-1.5 max-w-xs text-sm text-slate-600 dark:text-slate-400">{submessage}</p>
      </div>
    </div>
  );
}
