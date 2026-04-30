import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasActiveStripeSubscription } from "@/lib/entitlements";
import { getStripe, isStripeConfigured, proPriceId } from "@/lib/stripe";

export const runtime = "nodejs";
export const maxDuration = 60;

function appOrigin(request: NextRequest) {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    request.nextUrl.origin ||
    "http://localhost:3000"
  );
}

function stripeErrorMessage(e: unknown): string {
  if (e instanceof Stripe.errors.StripeError) {
    return e.message;
  }
  if (e instanceof Error && e.message) {
    return e.message;
  }
  return "Checkout could not start.";
}

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured() || !process.env.STRIPE_PRICE_ID_PRO?.trim()) {
      return NextResponse.json(
        { error: "Stripe is not fully configured (STRIPE_SECRET_KEY and STRIPE_PRICE_ID_PRO)." },
        { status: 503 }
      );
    }
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const u = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!u) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    if (hasActiveStripeSubscription(u)) {
      return NextResponse.json(
        {
          error:
            "You already have a subscription. Use Manage billing to update payment, change plan, or cancel.",
        },
        { status: 409 }
      );
    }

    const origin = appOrigin(request);
    const stripe = getStripe();
    let customerId = u.stripeCustomerId;

    if (customerId) {
      const cust = await stripe.customers.retrieve(customerId);
      if (cust.deleted) {
        await prisma.user.update({
          where: { id: u.id },
          data: { stripeCustomerId: null },
        });
        customerId = null;
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
    });

    if (!checkout.url) {
      return NextResponse.json(
        { error: "No checkout URL returned from Stripe." },
        { status: 500 }
      );
    }
    return NextResponse.json({ url: checkout.url });
  } catch (e) {
    console.error("[api/stripe/checkout]", e);
    const message = stripeErrorMessage(e);
    return NextResponse.json(
      {
        error:
          message.length > 280
            ? `${message.slice(0, 280)}… (see server terminal for full error)`
            : message,
      },
      { status: 502 }
    );
  }
}
