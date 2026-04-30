import Link from "next/link";
import { UpgradeButton } from "@/components/dashboard/UpgradeButton";
import {
  FREE_LEAD_LIMIT,
  FREE_SEARCHES_PER_DAY,
  PRO_SEARCHES_PER_DAY,
} from "@/lib/entitlements";

type Props = {
  isPro: boolean;
  hasStripeSub: boolean;
  /** Shown on Pro card when price comes from Stripe */
  proPriceLabel?: string | null;
};

const starterBullets = [
  `${FREE_LEAD_LIMIT} leads total (lifetime)`,
  `${FREE_SEARCHES_PER_DAY} discovery searches per day`,
  "CRM & pipeline basics",
  "Limited Pro features",
];

const proBullets = [
  "Unlimited leads (fair use)",
  `${PRO_SEARCHES_PER_DAY} discovery searches per day`,
  "Full Pro feature access",
  "Higher limits for growth workflows",
];

export function PlanComparisonGrid({ isPro, hasStripeSub, proPriceLabel }: Props) {
  const proPrice =
    proPriceLabel && proPriceLabel.length > 0 ? proPriceLabel : "See checkout for pricing";

  return (
    <div id="compare-plans" className="scroll-mt-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Compare plans</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Pick the tier that matches how you use LocalGrowth.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Starter */}
        <div
          className={
            "flex flex-col rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900 " +
            (!isPro
              ? "border-violet-300 ring-1 ring-violet-200/60 dark:border-violet-800 dark:ring-violet-900/40"
              : "border-slate-200/90 dark:border-slate-800")
          }
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Starter</h3>
            {!isPro && (
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-950/60 dark:text-violet-200">
                Current
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Get started finding businesses and managing leads.
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">$0</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">No card required</p>

          <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-slate-700 dark:text-slate-300">
            {starterBullets.map((line) => (
              <li key={line} className="flex gap-2.5">
                <span className="mt-0.5 text-violet-600 dark:text-violet-400" aria-hidden>
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            {isPro ? (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                {hasStripeSub
                  ? "Change plan in Stripe when your workspace allows."
                  : "Your plan isn’t billed through Stripe on this account."}
              </p>
            ) : (
              <p className="text-center text-sm font-medium text-slate-600 dark:text-slate-300">Your active plan</p>
            )}
          </div>
        </div>

        {/* Pro */}
        <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-violet-500/80 bg-gradient-to-b from-violet-50/90 to-white p-6 shadow-md dark:border-violet-500/50 dark:from-violet-950/40 dark:to-slate-900">
          <div className="absolute right-0 top-0 rounded-bl-xl bg-violet-600 px-3 py-1 text-xs font-semibold text-white dark:bg-violet-500">
            Popular
          </div>
          <div className="flex items-center justify-between gap-2 pr-16">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Pro</h3>
            {isPro && (
              <span className="rounded-full bg-violet-600/15 px-2.5 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-500/20 dark:text-violet-200">
                Current
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Scale discovery, leads, and Pro-only tools.
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {proPrice}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Billed in Stripe</p>

          <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-slate-800 dark:text-slate-200">
            <li className="font-medium text-slate-900 dark:text-white">All Starter features, plus:</li>
            {proBullets.map((line) => (
              <li key={line} className="flex gap-2.5">
                <span className="mt-0.5 text-violet-600 dark:text-violet-400" aria-hidden>
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            {isPro ? (
              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                {hasStripeSub ? (
                  <>
                    Manage billing or cancel in the{" "}
                    <span className="font-medium text-slate-800 dark:text-slate-200">Billing &amp; invoices</span>{" "}
                    section below.
                  </>
                ) : (
                  "Billing changes aren’t available in the portal for this account."
                )}
              </p>
            ) : (
              <UpgradeButton
                className="w-full justify-center py-3 text-base font-semibold shadow-lg shadow-violet-500/20"
                label="Upgrade to Pro"
              />
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Full comparison on the{" "}
        <Link href="/#pricing" className="font-medium text-violet-600 hover:underline dark:text-violet-400">
          marketing site
        </Link>
        .
      </p>
    </div>
  );
}
