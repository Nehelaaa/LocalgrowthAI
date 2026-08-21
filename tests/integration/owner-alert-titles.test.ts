import { describe, expect, it } from "vitest";
import {
  checkoutCompletedTitle,
  subscriptionCanceledTitle,
  subscriptionUpdateAlert,
} from "@/lib/owner-billing-alert-titles";

describe("owner billing alert titles", () => {
  it("produces distinct titles for cancel / cancel-at-period-end / status change / checkout", () => {
    const canceled = subscriptionCanceledTitle("customer.subscription.updated");
    const deleted = subscriptionCanceledTitle("customer.subscription.deleted");
    const cancelAtEnd = subscriptionUpdateAlert(
      { id: "sub_1", status: "active", cancel_at_period_end: true },
      { cancel_at_period_end: false }
    );
    const planChange = subscriptionUpdateAlert(
      { id: "sub_1", status: "active", cancel_at_period_end: false },
      { status: "past_due" }
    );
    const pastDue = subscriptionUpdateAlert(
      { id: "sub_1", status: "past_due", cancel_at_period_end: false },
      { status: "active" }
    );
    const checkoutActive = checkoutCompletedTitle({ status: "active" });
    const checkoutCanceled = checkoutCompletedTitle({ status: "canceled" });

    const titles = [
      canceled,
      deleted,
      cancelAtEnd.title,
      planChange.title,
      pastDue.title,
      checkoutActive,
      checkoutCanceled,
    ];

    expect(canceled).toBe("Subscription canceled");
    expect(deleted).toBe("Subscription deleted");
    expect(cancelAtEnd.title).toBe("Subscription set to cancel at period end");
    expect(planChange.title).toBe("Subscription status: past_due → active");
    expect(pastDue.title).toBe("Subscription past due");
    expect(checkoutActive).toBe("Checkout completed (subscription)");
    expect(checkoutCanceled).toBe("Checkout completed — subscription already canceled");

    // No single generic title for everything
    expect(new Set(titles).size).toBe(titles.length);
    expect(titles.every((t) => t === "Checkout completed (subscription)")).toBe(false);
  });
});
