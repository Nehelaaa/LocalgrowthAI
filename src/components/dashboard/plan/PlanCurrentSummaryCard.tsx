import type { ReactNode } from "react";
import { PlanCurrentActions } from "./PlanCurrentActions";

type Props = {
  headline: string;
  subline: string;
  bullets: string[];
  badges?: ReactNode;
  /** Extra status (Stripe, legacy, cancellation) */
  meta?: ReactNode;
  hasStripeSub: boolean;
  isPro: boolean;
};

export function PlanCurrentSummaryCard({
  headline,
  subline,
  bullets,
  badges,
  meta,
  hasStripeSub,
  isPro,
}: Props) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            You&apos;re on the {headline}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subline}</p>
          <ul className="mt-5 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2.5">
                <span className="text-violet-600 dark:text-violet-400" aria-hidden>
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="shrink-0 sm:pt-0.5">
          <PlanCurrentActions hasStripeSub={hasStripeSub} isPro={isPro} />
        </div>
      </div>

      {badges && <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">{badges}</div>}

      {meta && <div className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{meta}</div>}
    </div>
  );
}
