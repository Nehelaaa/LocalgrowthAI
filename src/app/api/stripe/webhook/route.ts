import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createOwnerBillingEvent,
  findUserIdByStripeCustomerId,
  hasProcessedStripeEvent,
} from "@/lib/owner-billing-events";
import {
  checkoutCompletedTitle,
  subscriptionUpdateAlert,
  subscriptionCanceledTitle,
  type SubPrev,
} from "@/lib/owner-billing-alert-titles";
import { getStripe, isStripeConfigured, stripeWebhookSecretsResolved } from "@/lib/stripe";
import { subscriptionToUserData, syncUserSubscriptionFromStripe } from "@/lib/stripe-subscription-sync";
import type Stripe from "stripe";

export const runtime = "nodejs";

const CANCELED = "canceled";

function constructStripeEvent(stripe: Stripe, body: string, sig: string): Stripe.Event {
  const secrets = stripeWebhookSecretsResolved();
  if (secrets.length === 0) {
    throw new Error("NO_WEBHOOK_SECRET");
  }
  let lastErr: unknown;
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(body, sig, secret);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Invalid signature");
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

/** Webhook payloads sometimes omit `customer` on Charge; resolve via retrieve + PaymentIntent. */
async function resolveStripeCustomerIdForCharge(
  stripe: Stripe,
  ch: Stripe.Charge
): Promise<string | null> {
  const direct = customerIdFromStripeCustomerField(ch.customer);
  if (direct) return direct;
  if (!ch.id) return null;
  try {
    const full = await stripe.charges.retrieve(ch.id, {
      expand: ["customer", "payment_intent"],
    });
    const fromCharge = customerIdFromStripeCustomerField(full.customer);
    if (fromCharge) return fromCharge;
    const pi = full.payment_intent;
    if (pi && typeof pi === "object" && "customer" in pi) {
      return customerIdFromStripeCustomerField(
        (pi as Stripe.PaymentIntent).customer as string | Stripe.Customer | null
      );
    }
  } catch (e) {
    console.error("Stripe webhook: resolveStripeCustomerIdForCharge", e);
  }
  return null;
}

export async function POST(request: Request) {
  const secrets = stripeWebhookSecretsResolved();
  if (!isStripeConfigured() || secrets.length === 0) {
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
    event = constructStripeEvent(stripe, body, sig);
  } catch (err) {
    console.error("Stripe signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency: Stripe retries with the same event.id — skip side effects + logging.
  if (await hasProcessedStripeEvent(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === "subscription" && s.subscription && s.customer) {
          const customerId = typeof s.customer === "string" ? s.customer : s.customer.id;
          const subId = typeof s.subscription === "string" ? s.subscription : s.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          const userIdRaw = s.client_reference_id ?? s.metadata?.userId;

          let mappedUserId: string | null = null;

          if (userIdRaw) {
            const uid = String(userIdRaw);
            const dbUser = await prisma.user.findUnique({ where: { id: uid } });
            const cust = await stripe.customers.retrieve(customerId);

            if (cust.deleted) {
              console.error("Stripe webhook: checkout references deleted customer", customerId);
              await prisma.user.updateMany({
                where: { stripeCustomerId: customerId },
                data: { ...subscriptionToUserData(sub) },
              });
              mappedUserId = await findUserIdByStripeCustomerId(customerId);
            } else {
              const metaUserId = cust.metadata?.userId;
              const metaMismatch = Boolean(metaUserId && metaUserId !== uid);

              if (dbUser && !metaMismatch) {
                await prisma.user.update({
                  where: { id: uid },
                  data: {
                    stripeCustomerId: customerId,
                    ...subscriptionToUserData(sub),
                  },
                });
                mappedUserId = uid;
              } else {
                if (!dbUser) {
                  console.error("Stripe webhook: checkout session references unknown user", uid);
                }
                if (metaMismatch) {
                  console.error(
                    "Stripe webhook: checkout customer metadata mismatch",
                    customerId
                  );
                }
                await prisma.user.updateMany({
                  where: { stripeCustomerId: customerId },
                  data: { ...subscriptionToUserData(sub) },
                });
                mappedUserId = await findUserIdByStripeCustomerId(customerId);
              }
            }
          } else {
            await prisma.user.updateMany({
              where: { stripeCustomerId: customerId },
              data: { ...subscriptionToUserData(sub) },
            });
            mappedUserId = await findUserIdByStripeCustomerId(customerId);
          }

          await createOwnerBillingEvent({
            kind: "subscription_updated",
            severity: sub.status === CANCELED || sub.status === "unpaid" ? "warning" : "info",
            title: checkoutCompletedTitle(sub),
            body: `Subscription ${sub.id} is ${sub.status}.`,
            stripeEventId: event.id,
            stripeCustomerId: customerId,
            stripeSubscriptionId: sub.id,
            userId: mappedUserId,
            metadata: { checkoutSessionId: s.id, subscriptionStatus: sub.status },
          });

          const { captureServerEvent } = await import("@/lib/analytics/posthog-server");
          await captureServerEvent(mappedUserId ?? customerId, "checkout_completed", {
            stripeCheckoutSessionId: s.id,
            stripeSubscriptionId: sub.id,
            stripeCustomerId: customerId,
            subscriptionStatus: sub.status,
          });
        } else if (
          s.mode === "payment" &&
          (s.payment_status === "paid" || s.status === "complete") &&
          (s.metadata?.kind === "invoice_share_payment" ||
            s.metadata?.invoiceShareToken ||
            s.metadata?.invoiceShareId)
        ) {
          const { markInvoiceSharePaidFromCheckout } = await import("@/lib/stripe-connect");
          const paid = await markInvoiceSharePaidFromCheckout(s);
          await createOwnerBillingEvent({
            kind: "other",
            severity: "info",
            title: "Invoice share payment completed",
            body: paid
              ? `Shared invoice ${paid.shareId} marked paid (session ${s.id}).`
              : `Payment checkout ${s.id} completed (invoice share metadata missing match).`,
            stripeEventId: event.id,
            userId: paid?.userId ?? null,
            metadata: {
              mode: s.mode,
              sessionId: s.id,
              invoiceShareId: paid?.shareId ?? s.metadata?.invoiceShareId ?? null,
              amountTotal: s.amount_total,
              currency: s.currency,
            },
          });
          if (paid) {
            const { captureServerEvent } = await import("@/lib/analytics/posthog-server");
            await captureServerEvent(paid.userId, "invoice_share_paid", {
              invoiceShareId: paid.shareId,
              stripeCheckoutSessionId: s.id,
              amountTotal: s.amount_total,
              currency: s.currency,
            });
          }
        } else {
          // Still record the Stripe event id so retries are no-ops.
          await createOwnerBillingEvent({
            kind: "other",
            severity: "info",
            title: "Checkout completed (non-subscription)",
            body: s.id ? `Checkout session ${s.id} (mode ${s.mode ?? "unknown"}).` : "Checkout completed.",
            stripeEventId: event.id,
            metadata: { mode: s.mode, sessionId: s.id },
          });
        }
        break;
      }
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const { applyConnectAccountUpdated } = await import("@/lib/stripe-connect");
        const userId = await applyConnectAccountUpdated(account);
        await createOwnerBillingEvent({
          kind: "other",
          severity: "info",
          title: "Stripe Connect account updated",
          body: `Connect account ${account.id}: charges=${Boolean(account.charges_enabled)} details=${Boolean(account.details_submitted)}.`,
          stripeEventId: event.id,
          userId,
          metadata: {
            accountId: account.id,
            chargesEnabled: account.charges_enabled,
            detailsSubmitted: account.details_submitted,
            payoutsEnabled: account.payouts_enabled,
          },
        });
        break;
      }
      case "account.application.deauthorized": {
        const app = event.data.object as { id?: string };
        // Connected account revoked platform access — clear by account id on event account.
        const accountId =
          typeof (event as { account?: string }).account === "string"
            ? (event as { account?: string }).account
            : null;
        if (accountId) {
          await prisma.user.updateMany({
            where: { stripeConnectAccountId: accountId },
            data: {
              stripeConnectAccountId: null,
              stripeConnectDetailsSubmitted: false,
              stripeConnectChargesEnabled: false,
              stripeConnectPayoutsEnabled: false,
              stripeConnectOnboardedAt: null,
            },
          });
        }
        await createOwnerBillingEvent({
          kind: "other",
          severity: "warning",
          title: "Stripe Connect deauthorized",
          body: accountId
            ? `Connect account ${accountId} revoked platform access.`
            : `Connect application deauthorized (${app.id ?? "unknown"}).`,
          stripeEventId: event.id,
          metadata: { accountId, applicationId: app.id ?? null },
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const mappedUserId = await findUserIdByStripeCustomerId(customerId);
        const previous = (event.data.previous_attributes ?? undefined) as SubPrev | undefined;

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

          const subEx = sub as Stripe.Subscription & {
            canceled_at?: number | null;
            cancellation_details?: {
              reason?: string | null;
              comment?: string | null;
              feedback?: string | null;
            } | null;
          };
          const cancelReason = subEx.cancellation_details?.reason ?? null;
          const cancelComment = subEx.cancellation_details?.comment ?? null;
          const canceledAtIso =
            typeof subEx.canceled_at === "number"
              ? new Date(subEx.canceled_at * 1000).toISOString()
              : null;

          await createOwnerBillingEvent({
            kind: "subscription_canceled",
            severity: "warning",
            title: subscriptionCanceledTitle(event.type),
            body:
              cancelReason || cancelComment
                ? `Stripe subscription ${sub.id} ended (${sub.status}).${cancelReason ? ` Reason: ${cancelReason}.` : ""}${cancelComment ? ` Note: ${cancelComment}` : ""}`
                : `Stripe subscription ${sub.id} ended with status ${sub.status}.`,
            stripeEventId: event.id,
            stripeCustomerId: customerId,
            stripeSubscriptionId: sub.id,
            userId: mappedUserId,
            metadata: {
              eventType: event.type,
              subscriptionStatus: sub.status,
              cancellationReason: cancelReason,
              cancellationComment: cancelComment,
              canceledAt: canceledAtIso,
              previousAttributes: previous ?? null,
            },
          });
        } else {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { ...subscriptionToUserData(sub) },
          });

          const alert = subscriptionUpdateAlert(sub, previous);
          await createOwnerBillingEvent({
            kind: "subscription_updated",
            severity: alert.severity,
            title: alert.title,
            body: alert.body,
            stripeEventId: event.id,
            stripeCustomerId: customerId,
            stripeSubscriptionId: sub.id,
            userId: mappedUserId,
            metadata: {
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              status: sub.status,
              previousAttributes: previous ?? null,
            },
          });
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
          stripeEventId: event.id,
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
          if (mappedUserId) {
            await syncUserSubscriptionFromStripe(mappedUserId);
          }
          await createOwnerBillingEvent({
            kind: "payment_succeeded",
            severity: "info",
            title:
              reason === "subscription_create"
                ? "Subscription payment succeeded"
                : "Subscription renewed",
            body: inv.id ? `Invoice ${inv.id} paid.` : "Invoice paid.",
            stripeEventId: event.id,
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
        const customerId = await resolveStripeCustomerIdForCharge(stripe, ch);
        const mappedUserId = await findUserIdByStripeCustomerId(customerId);
        const fullyRefunded = (ch.amount_refunded ?? 0) >= (ch.amount ?? 0);
        const currency = (ch.currency ?? "usd").toUpperCase();
        const refundedMinor = ch.amount_refunded ?? 0;
        const amountMinor = ch.amount ?? 0;
        const amountLabel =
          refundedMinor > 0
            ? `${(refundedMinor / 100).toLocaleString(undefined, { style: "currency", currency })} refunded`
            : undefined;

        const piId =
          typeof ch.payment_intent === "string"
            ? ch.payment_intent
            : ch.payment_intent?.id ?? null;
        if (fullyRefunded && piId) {
          const { markInvoiceShareRefundedFromPaymentIntent } = await import(
            "@/lib/stripe-connect"
          );
          await markInvoiceShareRefundedFromPaymentIntent(piId);
        }

        await createOwnerBillingEvent({
          kind: "refund",
          severity: fullyRefunded ? "warning" : "info",
          title: fullyRefunded ? "Charge fully refunded" : "Charge partially refunded",
          body: [ch.id ? `Charge ${ch.id}.` : null, amountLabel].filter(Boolean).join(" "),
          stripeEventId: event.id,
          stripeCustomerId: customerId,
          stripeChargeId: ch.id,
          userId: mappedUserId,
          metadata: {
            amount: amountMinor,
            amountRefunded: refundedMinor,
            currency: ch.currency,
            paymentIntentId: piId,
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
          stripeEventId: event.id,
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
