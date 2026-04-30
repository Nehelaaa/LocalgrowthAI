import Link from "next/link";
import { BillingSubscriptionControls } from "@/components/dashboard/BillingSubscriptionControls";
import type { BillingControlsMode } from "@/components/dashboard/BillingSubscriptionControls";
import { ManageBillingButton } from "@/components/dashboard/ManageBillingButton";
import { PlanComparisonGrid } from "@/components/dashboard/plan/PlanComparisonGrid";
import { PlanCurrentSummaryCard } from "@/components/dashboard/plan/PlanCurrentSummaryCard";
import { PlanUsageCard } from "@/components/dashboard/plan/PlanUsageCard";
import {
  FREE_LEAD_LIMIT,
  FREE_SEARCHES_PER_DAY,
  PRO_SEARCHES_PER_DAY,
  canCreateMoreLeads,
  hasActiveStripeSubscription,
  hasProEntitlement,
  starterLeadsRemaining,
} from "@/lib/entitlements";
import { requireDashboardUser } from "@/lib/session-user";
import { getSearchUsageState } from "@/lib/search-usage";
import {
  getStripePlanPresentment,
  listInvoicesForCustomer,
  type SafeInvoiceRow,
} from "@/lib/stripe-customer-billing";
import { getSubscriptionDisplayInfo } from "@/lib/stripe-subscription-display";
import { customerBillingFaq } from "@/lib/billing-policies";

type Props = { searchParams: Promise<{ checkout?: string; portal?: string }> };

function formatLongDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
}

function formatInvoiceDate(createdUnix: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(createdUnix * 1000)
  );
}

function formatMoneyMinor(amountPaid: number, currency: string): string {
  const c = currency.length === 3 ? currency : "USD";
  return (amountPaid / 100).toLocaleString(undefined, { style: "currency", currency: c });
}

function subscriptionStatusSummary(status: string | null | undefined): string {
  switch (status) {
    case "active":
      return "Paid and current. Access continues while the subscription stays active.";
    case "trialing":
      return "Trial active — full Pro access until the trial ends.";
    case "past_due":
      return "Payment failed — update your card in the billing portal to avoid losing access.";
    case "canceled":
      return "Canceled — access follows your Stripe subscription rules.";
    case "unpaid":
      return "Unpaid — complete payment to restore access.";
    case "paused":
      return "Paused — billing may resume depending on your Stripe settings.";
    case "incomplete":
      return "Incomplete — finish checkout to activate.";
    case "incomplete_expired":
      return "Checkout expired — start again when ready.";
    default:
      return status ? `Stripe: ${status.replace(/_/g, " ")}` : "";
  }
}

function invoiceDownloadHref(inv: SafeInvoiceRow): string | null {
  return inv.hostedInvoiceUrl ?? inv.invoicePdf;
}

export default async function PlanPage({ searchParams }: Props) {
  const user = await requireDashboardUser();
  const sp = await searchParams;
  const isPro = hasProEntitlement(user);
  const hasStripeSub = hasActiveStripeSubscription(user);

  const [liveSub, presentment, invoices, searchUsage] = await Promise.all([
    user.stripeSubscriptionId != null
      ? getSubscriptionDisplayInfo(user.stripeSubscriptionId)
      : Promise.resolve(null),
    getStripePlanPresentment(user),
    user.stripeCustomerId
      ? listInvoicesForCustomer(user.stripeCustomerId, 30)
      : Promise.resolve([] as SafeInvoiceRow[]),
    getSearchUsageState(user),
  ]);

  const periodEndDate = liveSub?.currentPeriodEnd ?? user.subscriptionPeriodEnd ?? null;
  const periodEndLabel = formatLongDate(periodEndDate);
  const cancelScheduled = Boolean(liveSub?.cancelAtPeriodEnd);

  const leadsUsed = user.lifetimeLeadsCreated;
  const leadsRemain = starterLeadsRemaining(user);
  const atLeadCap = !canCreateMoreLeads(leadsUsed, user);

  const { used: searchUsed, limit: searchLimit, remaining: searchRemaining } = searchUsage;
  const atSearchCap = searchLimit > 0 && searchRemaining === 0;
  const nearLeadCap =
    !atLeadCap && (leadsUsed / FREE_LEAD_LIMIT >= 0.8 || leadsRemain <= 1);
  const nearSearchCap =
    !atSearchCap &&
    searchLimit > 0 &&
    (searchUsed / searchLimit >= 0.8 ||
      searchRemaining <= Math.max(1, Math.ceil(searchLimit * 0.2)));

  const showHardLimitBanner = !isPro && (atLeadCap || atSearchCap);
  const showNearLimitBanner = !isPro && !showHardLimitBanner && (nearLeadCap || nearSearchCap);

  const productTitle = (() => {
    if (!isPro) return "Starter";
    if (presentment?.productName) return presentment.productName;
    return "Pro";
  })();

  const planHeadline = !isPro ? "Starter plan" : `${productTitle} plan`;

  const planSubline = !isPro
    ? "Upgrade anytime for unlimited leads and a higher daily search quota."
    : hasStripeSub
      ? "Your subscription is managed in Stripe."
      : user.grandfatheredPro
        ? "Legacy Pro access on your account."
        : "Pro access without an active Stripe subscription on this account.";

  const summaryBullets = !isPro
    ? [
        `${FREE_SEARCHES_PER_DAY} discovery searches per day`,
        `Up to ${FREE_LEAD_LIMIT} leads saved total (lifetime)`,
      ]
    : [
        `${PRO_SEARCHES_PER_DAY} discovery searches per day`,
        "Unlimited leads (fair use) and full Pro features",
      ];

  const billingControlsMode: BillingControlsMode = !isPro
    ? "starter"
    : hasStripeSub
      ? "stripe_subscriber"
      : user.grandfatheredPro
        ? "pro_legacy"
        : "pro_not_billed";

  const paidInvoices = invoices.filter((i) => i.amountPaid > 0 || i.status === "paid");
  const showLegacyNote = user.grandfatheredPro;
  const showProWithoutStripeNote =
    !user.grandfatheredPro && isPro && !hasStripeSub;
  const showStripeStatusLine = hasStripeSub && user.subscriptionStatus;
  const stripeStatusBlurb = showStripeStatusLine
    ? subscriptionStatusSummary(user.subscriptionStatus)
    : "";

  const proPriceForGrid =
    hasStripeSub && presentment
      ? `${presentment.priceFormatted} ${presentment.intervalLabel}`
      : null;

  const metaBlock = (
    <>
      {stripeStatusBlurb && <p>{stripeStatusBlurb}</p>}
      {showLegacyNote && (
        <p>
          <span className="font-medium text-slate-800 dark:text-slate-200">Legacy Pro</span>{" "}
          {hasStripeSub
            ? "together with Stripe billing."
            : "— full access without a Stripe subscription on file. Contact support if you need a billed plan."}
        </p>
      )}
      {showProWithoutStripeNote && (
        <p>
          <span className="font-medium text-slate-800 dark:text-slate-200">Pro access</span> without a billed
          Stripe subscription on this account.
        </p>
      )}
      {cancelScheduled && periodEndLabel && (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2 text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/25 dark:text-amber-100">
          <span className="font-medium">Cancellation scheduled</span> — access through{" "}
          {periodEndLabel}. You can often undo this in the billing portal.
        </p>
      )}
      {!isPro && showHardLimitBanner && (
        <p>
          <Link
            href="/dashboard"
            className="font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            ← Back to dashboard
          </Link>
        </p>
      )}
    </>
  );

  const hasMeta =
    Boolean(stripeStatusBlurb) ||
    showLegacyNote ||
    showProWithoutStripeNote ||
    (cancelScheduled && periodEndLabel) ||
    (!isPro && showHardLimitBanner);

  return (
    <div className="w-full min-w-0 max-w-5xl space-y-8 pb-10">
      <header className="border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Plans &amp; billing
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
          Your plan, usage, and Stripe billing in one place.
        </p>
      </header>

      <div className="space-y-2">
        {sp.checkout === "success" && (
          <div
            className="rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-3 py-2.5 text-sm text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100"
            role="status"
          >
            Payment received — your plan should update within a minute.
          </div>
        )}
        {sp.checkout === "canceled" && (
          <div
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
            role="status"
          >
            Checkout canceled. You can try again anytime.
          </div>
        )}
        {sp.portal === "return" && (
          <div
            className="rounded-lg border border-violet-200/80 bg-violet-50/90 px-3 py-2.5 text-sm text-violet-900 dark:border-violet-500/25 dark:bg-violet-950/30 dark:text-violet-100"
            role="status"
          >
            Welcome back — refresh if changes don&apos;t show yet.
          </div>
        )}
      </div>

      {/* Reference-style top row: current plan + usage */}
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6 lg:items-stretch">
        <PlanCurrentSummaryCard
          headline={planHeadline}
          subline={planSubline}
          bullets={summaryBullets}
          hasStripeSub={hasStripeSub}
          isPro={isPro}
          badges={
            isPro || showLegacyNote || showStripeStatusLine ? (
              <>
                {isPro && (
                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-950/60 dark:text-violet-200">
                    Pro
                  </span>
                )}
                {showLegacyNote && (
                  <span className="rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                    Legacy
                  </span>
                )}
                {showStripeStatusLine && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    {user.subscriptionStatus?.replace(/_/g, " ")}
                  </span>
                )}
              </>
            ) : undefined
          }
          meta={hasMeta ? metaBlock : undefined}
        />

        <PlanUsageCard
          isPro={isPro}
          leadsUsed={leadsUsed}
          leadsRemaining={leadsRemain}
          searchUsed={searchUsed}
          searchLimit={searchLimit}
          searchRemaining={searchRemaining}
          showNearWarning={showNearLimitBanner}
          showHardWarning={showHardLimitBanner}
          nearLeadCap={nearLeadCap}
          nearSearchCap={nearSearchCap}
          atLeadCap={atLeadCap}
          atSearchCap={atSearchCap}
        />
      </div>

      <PlanComparisonGrid
        isPro={isPro}
        hasStripeSub={hasStripeSub}
        proPriceLabel={proPriceForGrid}
      />

      {hasStripeSub && (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Billing &amp; invoices
          </h2>
          <div className="mt-6">
            <BillingSubscriptionControls mode={billingControlsMode} />
          </div>
          <dl className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Status</dt>
              <dd className="mt-0.5 capitalize text-slate-900 dark:text-white">
                {(user.subscriptionStatus ?? "—").replace(/_/g, " ")}
              </dd>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Current period ends</dt>
              <dd className="mt-0.5 text-slate-900 dark:text-white">{periodEndLabel ?? "—"}</dd>
            </div>
          </dl>

          {paidInvoices.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              No invoices yet. After your first successful payment, download links will appear here.
            </p>
          ) : (
            <div className="mt-8">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recent invoices
              </p>
              <div className="mt-3 overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Date</th>
                      <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Invoice</th>
                      <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300">Amount</th>
                      <th className="px-3 py-2.5 font-medium text-slate-600 dark:text-slate-300"> </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paidInvoices.map((inv) => {
                      const href = invoiceDownloadHref(inv);
                      return (
                        <tr key={inv.id} className="bg-white dark:bg-slate-900">
                          <td className="whitespace-nowrap px-3 py-2 text-slate-600 dark:text-slate-400">
                            {formatInvoiceDate(inv.createdUnix)}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                            {inv.number ?? `${inv.id.slice(0, 12)}…`}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-slate-900 dark:text-white">
                            {formatMoneyMinor(inv.amountPaid, inv.currency)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {href ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                              >
                                PDF
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {user.stripeCustomerId && !hasStripeSub && (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Payment method
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Add or update a card in Stripe&apos;s portal.
          </p>
          <div className="mt-4">
            <ManageBillingButton
              variant="primary"
              className="min-h-11 justify-center px-6"
              label="Open billing portal"
            />
          </div>
        </section>
      )}

      {billingControlsMode === "pro_not_billed" && (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Billing
          </h2>
          <div className="mt-4">
            <BillingSubscriptionControls mode="pro_not_billed" />
          </div>
        </section>
      )}

      <details className="group rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-slate-800 marker:hidden dark:text-slate-200 sm:px-6 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            {customerBillingFaq.cancelTitle}
            <span className="text-slate-400 transition group-open:rotate-180">▼</span>
          </span>
        </summary>
        <div className="border-t border-slate-100 px-5 pb-5 pt-2 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-400 sm:px-6">
          <ul className="list-disc space-y-2 pl-5">
            {customerBillingFaq.cancelBody.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
