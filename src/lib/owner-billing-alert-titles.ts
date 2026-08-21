import type { OwnerBillingSeverity } from "@/lib/owner-billing-events";

const CANCELED = "canceled";

export type SubPrev = {
  status?: string;
  cancel_at_period_end?: boolean;
};

export type SubLike = {
  id: string;
  status: string;
  cancel_at_period_end?: boolean | null;
};

/** Titles for customer.subscription.updated (non-canceled path). */
export function subscriptionUpdateAlert(
  sub: SubLike,
  previous: SubPrev | undefined
): {
  title: string;
  severity: OwnerBillingSeverity;
  body: string;
} {
  const prevCancel = previous?.cancel_at_period_end;
  const prevStatus = previous?.status;

  if (sub.cancel_at_period_end && prevCancel !== true) {
    return {
      title: "Subscription set to cancel at period end",
      severity: "warning",
      body: `Subscription ${sub.id} will cancel at period end (status ${sub.status}).`,
    };
  }
  if (prevCancel === true && !sub.cancel_at_period_end) {
    return {
      title: "Subscription cancellation reversed",
      severity: "info",
      body: `Subscription ${sub.id} is no longer set to cancel at period end (status ${sub.status}).`,
    };
  }
  if (sub.status === "past_due") {
    return {
      title: "Subscription past due",
      severity: "warning",
      body: `Subscription ${sub.id} is past_due.`,
    };
  }
  if (prevStatus && prevStatus !== sub.status) {
    return {
      title: `Subscription status: ${prevStatus} → ${sub.status}`,
      severity:
        sub.status === "unpaid" || sub.status === "incomplete_expired" ? "warning" : "info",
      body: `Subscription ${sub.id} changed from ${prevStatus} to ${sub.status}.`,
    };
  }
  if (sub.status === "active" || sub.status === "trialing") {
    return {
      title: "Subscription updated",
      severity: "info",
      body: `Subscription ${sub.id} is ${sub.status}.`,
    };
  }
  return {
    title: `Subscription updated (${sub.status})`,
    severity: "info",
    body: `Subscription ${sub.id} is ${sub.status}.`,
  };
}

export function checkoutCompletedTitle(sub: Pick<SubLike, "status">): string {
  if (sub.status === CANCELED) {
    return "Checkout completed — subscription already canceled";
  }
  if (sub.status === "past_due" || sub.status === "unpaid") {
    return `Checkout completed — subscription ${sub.status}`;
  }
  if (sub.status === "trialing") {
    return "Checkout completed — trial started";
  }
  if (sub.status === "active") {
    return "Checkout completed (subscription)";
  }
  return `Checkout completed — subscription ${sub.status}`;
}

/** Title used when subscription is deleted or status is canceled. */
export function subscriptionCanceledTitle(eventType: string): string {
  return eventType === "customer.subscription.deleted"
    ? "Subscription deleted"
    : "Subscription canceled";
}
