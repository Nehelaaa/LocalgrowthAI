import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createOwnerBillingEvent,
  findUserIdByStripeCustomerId,
} from "@/lib/owner-billing-events";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";

const ACTIVE = "active";
const TRIAL = "trialing";
const CANCELED = "canceled";

type SubWithPeriod = Stripe.Subscription & { current_period_end: number };

function subToData(sub: SubWithPeriod) {
  const isPro = sub.status === ACTIVE || sub.status === TRIAL || sub.status === "past_due";
  return {
    stripeSubscriptionId: sub.id,
    subscriptionStatus: sub.status,
    plan: isPro ? "pro" : "free",
    subscriptionPeriodEnd: new Date(sub.current_period_end * 1000),
  } as const;
}

function customerIdFromStripeCustomerField(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function subscriptionIdFromInvoice(inv: Stripe.Invoice): string | null {
  // Stripe's TS definitions vary by API version; runtime still includes this field for subscription invoices.
  const sub = (inv as unknown as { subscription?: string | Stripe.Subscription | null }).subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

export async function POST(request: Request) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const h = await headers();
  const sig = h.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === "subscription" && s.subscription && s.customer) {
          const customerId = typeof s.customer === "string" ? s.customer : s.customer.id;
          const subId = typeof s.subscription === "string" ? s.subscription : s.subscription.id;
          const sub = (await stripe.subscriptions.retrieve(subId)) as unknown as SubWithPeriod;
          const userId = s.client_reference_id ?? s.metadata?.userId;
          if (userId) {
            await prisma.user.update({
              where: { id: String(userId) },
              data: {
                stripeCustomerId: customerId,
                ...subToData(sub),
              },
            });
          } else {
            await prisma.user.updateMany({
              where: { stripeCustomerId: customerId },
              data: { ...subToData(sub) },
            });
          }

          const mappedUserId =
            (userId ? String(userId) : null) ??
            (await findUserIdByStripeCustomerId(customerId));
          await createOwnerBillingEvent({
            kind: "subscription_updated",
            severity: "info",
            title: "Checkout completed (subscription)",
            body: `Subscription ${sub.id} is ${sub.status}.`,
            stripeCustomerId: customerId,
            stripeSubscriptionId: sub.id,
            userId: mappedUserId,
            metadata: { checkoutSessionId: s.id },
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as SubWithPeriod;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const mappedUserId = await findUserIdByStripeCustomerId(customerId);

        if (event.type === "customer.subscription.deleted" || sub.status === CANCELED) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              plan: "free",
              subscriptionStatus: sub.status,
              stripeSubscriptionId: null,
              subscriptionPeriodEnd: null,
            },
          });

          await createOwnerBillingEvent({
            kind: "subscription_canceled",
            severity: "warning",
            title:
              event.type === "customer.subscription.deleted"
                ? "Subscription deleted"
                : "Subscription canceled",
            body: `Stripe subscription ${sub.id} ended with status ${sub.status}.`,
            stripeCustomerId: customerId,
            stripeSubscriptionId: sub.id,
            userId: mappedUserId,
            metadata: { eventType: event.type },
          });
        } else {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { ...subToData(sub) },
          });

          if (sub.cancel_at_period_end) {
            await createOwnerBillingEvent({
              kind: "subscription_updated",
              severity: "warning",
              title: "Subscription set to cancel at period end",
              body: `Stripe subscription ${sub.id} will cancel at period end.`,
              stripeCustomerId: customerId,
              stripeSubscriptionId: sub.id,
              userId: mappedUserId,
              metadata: { cancelAtPeriodEnd: true, status: sub.status },
            });
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = customerIdFromStripeCustomerField(inv.customer);
        const mappedUserId = await findUserIdByStripeCustomerId(customerId);
        const attemptCount = inv.attempt_count ?? 0;
        const severity = attemptCount >= 3 ? "critical" : "warning";

        await createOwnerBillingEvent({
          kind: "payment_failed",
          severity,
          title: "Invoice payment failed",
          body: inv.id
            ? `Invoice ${inv.id} failed (attempt ${attemptCount || 1}).`
            : `Payment failed (attempt ${attemptCount || 1}).`,
          stripeCustomerId: customerId,
          stripeInvoiceId: inv.id ?? null,
          stripeSubscriptionId: subscriptionIdFromInvoice(inv),
          userId: mappedUserId,
          metadata: {
            amountDue: inv.amount_due,
            currency: inv.currency,
            hostedInvoiceUrl: inv.hosted_invoice_url,
          },
        });
        break;
      }
      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        const reason = inv.billing_reason;
        if (reason === "subscription_create" || reason === "subscription_cycle") {
          const customerId = customerIdFromStripeCustomerField(inv.customer);
          const mappedUserId = await findUserIdByStripeCustomerId(customerId);
          await createOwnerBillingEvent({
            kind: "payment_succeeded",
            severity: "info",
            title:
              reason === "subscription_create"
                ? "Subscription payment succeeded"
                : "Subscription renewed",
            body: inv.id ? `Invoice ${inv.id} paid.` : "Invoice paid.",
            stripeCustomerId: customerId,
            stripeInvoiceId: inv.id ?? null,
            stripeSubscriptionId: subscriptionIdFromInvoice(inv),
            userId: mappedUserId,
            metadata: { billingReason: reason, amountPaid: inv.amount_paid, currency: inv.currency },
          });
        }
        break;
      }
      case "charge.refunded": {
        const ch = event.data.object as Stripe.Charge;
        const customerId = customerIdFromStripeCustomerField(ch.customer);
        const mappedUserId = await findUserIdByStripeCustomerId(customerId);
        const fullyRefunded = (ch.amount_refunded ?? 0) >= (ch.amount ?? 0);
        await createOwnerBillingEvent({
          kind: "refund",
          severity: fullyRefunded ? "warning" : "info",
          title: fullyRefunded ? "Charge fully refunded" : "Charge partially refunded",
          body: ch.id ? `Charge ${ch.id} refunded.` : "Refund processed.",
          stripeCustomerId: customerId,
          stripeChargeId: ch.id,
          userId: mappedUserId,
          metadata: {
            amount: ch.amount,
            amountRefunded: ch.amount_refunded,
            currency: ch.currency,
          },
        });
        break;
      }
      case "charge.dispute.created":
      case "charge.dispute.funds_withdrawn":
      case "charge.dispute.closed": {
        const d = event.data.object as Stripe.Dispute;
        const chId = typeof d.charge === "string" ? d.charge : d.charge?.id;
        let customerId: string | null = null;
        let mappedUserId: string | null = null;
        if (chId) {
          const ch = await stripe.charges.retrieve(chId);
          customerId = customerIdFromStripeCustomerField(ch.customer);
          mappedUserId = await findUserIdByStripeCustomerId(customerId);
        }

        const severity =
          event.type === "charge.dispute.created" || event.type === "charge.dispute.funds_withdrawn"
            ? "critical"
            : "warning";

        await createOwnerBillingEvent({
          kind: "dispute",
          severity,
          title: `Stripe dispute: ${event.type}`,
          body: d.id ? `Dispute ${d.id} · status ${d.status}` : `Dispute status ${d.status}`,
          stripeCustomerId: customerId,
          stripeChargeId: chId ?? null,
          userId: mappedUserId,
          metadata: { disputeId: d.id, status: d.status, reason: d.reason },
        });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Stripe webhook handler", e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
