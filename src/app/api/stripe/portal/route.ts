import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

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
  return "Could not open billing portal.";
}

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured (STRIPE_SECRET_KEY)." },
        { status: 503 }
      );
    }
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const u = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!u?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account yet" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const cust = await stripe.customers.retrieve(u.stripeCustomerId);
    if (!cust.deleted) {
      const owner = cust.metadata?.userId;
      if (owner && owner !== u.id) {
        return NextResponse.json(
          { error: "Billing account could not be verified." },
          { status: 403 }
        );
      }
      if (!owner) {
        await stripe.customers.update(u.stripeCustomerId, {
          metadata: { userId: u.id },
        });
      }
    }

    const origin = appOrigin(request);
    const portal = await stripe.billingPortal.sessions.create({
      customer: u.stripeCustomerId,
      return_url: `${origin}/dashboard/plan?portal=return`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (e) {
    console.error("[api/stripe/portal]", e);
    const message = stripeErrorMessage(e);
    return NextResponse.json(
      {
        error:
          message.length > 280
            ? `${message.slice(0, 280)}… (see server terminal)`
            : message,
      },
      { status: 502 }
    );
  }
}
