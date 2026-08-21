import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasActiveStripeSubscription } from "@/lib/entitlements";
import {
  getStripe,
  isStripeConfigured,
  proPriceId,
  stripePriceProConfigurationError,
  stripeProPriceIdResolved,
} from "@/lib/stripe";
import { billingPortalConfigurationId, checkoutBrandingSettings } from "@/lib/stripe-branding";
import { subscriptionToUserData } from "@/lib/stripe-subscription-sync";
import { enforceSameOrigin, rateLimitOr429 } from "@/lib/api-security";
import { stripeIntegrationPublicError } from "@/lib/stripe-integration-error";
import {
  clearUserStripeBilling,
  clearUserStripeSubscription,
  isStripeResourceMissingError,
} from "@/lib/stripe-stale-customer";

export const runtime = "nodejs";
export const maxDuration = 60;

function appOrigin(request: NextRequest) {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    request.nextUrl.origin ||
    "http://localhost:3000"
  );
}

async function portalUrlForCustomer(stripeCustomerId: string, request: NextRequest): Promise<string | null> {
  try {
    const stripe = getStripe();
    const origin = appOrigin(request);
    const cfg = billingPortalConfigurationId();
    const portal = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/dashboard/plan?portal=return`,
      ...(cfg ? { configuration: cfg } : {}),
    });
    return portal.url ?? null;
  } catch {
    return null;
  }
}

function isBlockingSubscriptionStatus(status: string | null | undefined): boolean {
  // If a subscription exists in any of these states, the customer should not start a new checkout.
  // They should complete/repair the existing subscription via Stripe.
  return Boolean(
    status &&
      status !== "canceled" &&
      status !== "incomplete_expired"
  );
}

export async function POST(request: NextRequest) {
  try {
    const originErr = enforceSameOrigin(request);
    if (originErr) return originErr;

    const priceCfgErr = stripePriceProConfigurationError();
    if (priceCfgErr) {
      return NextResponse.json({ error: priceCfgErr }, { status: 503 });
    }
    if (!isStripeConfigured() || !stripeProPriceIdResolved()) {
      return NextResponse.json(
        { error: "Stripe is not fully configured (STRIPE_SECRET_KEY and STRIPE_PRICE_ID_PRO)." },
        { status: 503 }
      );
    }
    const rl = rateLimitOr429(request, "stripe_checkout");
    if (rl) return rl;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let u = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!u) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const origin = appOrigin(request);
    const stripe = getStripe();
    let customerId = u.stripeCustomerId;

    if (customerId) {
      try {
        const cust = await stripe.customers.retrieve(customerId);
        if (cust.deleted) {
          await clearUserStripeBilling(u.id);
          customerId = null;
          u = (await prisma.user.findUnique({ where: { id: u.id } }))!;
        } else {
          const owner = cust.metadata?.userId;
          if (owner && owner !== u.id) {
            return NextResponse.json(
              { error: "Billing account could not be verified. Please contact support." },
              { status: 409 }
            );
          }
          if (!owner) {
            await stripe.customers.update(customerId, { metadata: { userId: u.id } });
          }
        }
      } catch (e) {
        if (isStripeResourceMissingError(e)) {
          await clearUserStripeBilling(u.id);
          customerId = null;
          u = (await prisma.user.findUnique({ where: { id: u.id } }))!;
        } else {
          throw e;
        }
      }
    }

    if (!customerId) {
      const c = await stripe.customers.create({
        email: u.email,
        name: u.name ?? undefined,
        metadata: { userId: u.id },
      });
      customerId = c.id;
      await prisma.user.update({
        where: { id: u.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Server-side safeguard: check Stripe directly so users can't accidentally pay twice
    // due to stale DB state or webhook lag.
    if (u.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(u.stripeSubscriptionId);
        if (isBlockingSubscriptionStatus(sub.status)) {
          await prisma.user.update({ where: { id: u.id }, data: subscriptionToUserData(sub) });
          const portalUrl = await portalUrlForCustomer(customerId, request);
          return NextResponse.json(
            {
              error: "You already have an existing subscription. Open billing portal to manage it.",
              portalUrl,
            },
            { status: 409 }
          );
        }
      } catch (e) {
        if (isStripeResourceMissingError(e)) {
          await clearUserStripeSubscription(u.id);
          u = (await prisma.user.findUnique({ where: { id: u.id } }))!;
        }
        // else fall through to list
      }
    }

    // If any subscription exists for this customer, do NOT start a new checkout session.
    let subs: Awaited<ReturnType<typeof stripe.subscriptions.list>>;
    try {
      subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
    } catch (e) {
      if (isStripeResourceMissingError(e)) {
        await clearUserStripeBilling(u.id);
        u = (await prisma.user.findUnique({ where: { id: u.id } }))!;
        const c = await stripe.customers.create({
          email: u.email,
          name: u.name ?? undefined,
          metadata: { userId: u.id },
        });
        customerId = c.id;
        await prisma.user.update({
          where: { id: u.id },
          data: { stripeCustomerId: customerId },
        });
        subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
      } else {
        throw e;
      }
    }
    const existing = subs.data.find((s) => isBlockingSubscriptionStatus(s.status));
    if (existing) {
      await prisma.user.update({ where: { id: u.id }, data: subscriptionToUserData(existing) });
      const portalUrl = await portalUrlForCustomer(customerId, request);
      return NextResponse.json(
        {
          error: "You already have an existing subscription. Open billing portal to manage it.",
          portalUrl,
        },
        { status: 409 }
      );
    }

    // DB-level fast path (kept after Stripe check for user-friendly messaging).
    if (hasActiveStripeSubscription(u)) {
      const portalUrl = await portalUrlForCustomer(customerId, request);
      return NextResponse.json(
        {
          error:
            "You already have a subscription. Use the billing portal to update payment, change plan, or cancel.",
          portalUrl,
        },
        { status: 409 }
      );
    }

    const price = proPriceId();
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/dashboard/plan?checkout=success`,
      cancel_url: `${origin}/dashboard/plan?checkout=canceled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      client_reference_id: u.id,
      metadata: { userId: u.id },
      subscription_data: {
        metadata: { userId: u.id },
      },
      branding_settings: checkoutBrandingSettings(origin),
    });

    if (!checkout.url) {
      return NextResponse.json(
        { error: "No checkout URL returned from Stripe." },
        { status: 500 }
      );
    }
    const { captureServerEvent } = await import("@/lib/analytics/posthog-server");
    await captureServerEvent(u.id, "checkout_started", {
      stripeCheckoutSessionId: checkout.id,
      priceId: price,
    });
    return NextResponse.json({ url: checkout.url });
  } catch (e) {
    console.error("[api/stripe/checkout]", e);
    return NextResponse.json({ error: stripeIntegrationPublicError(e) }, { status: 502 });
  }
}
