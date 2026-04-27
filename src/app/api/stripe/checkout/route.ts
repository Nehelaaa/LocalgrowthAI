import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured, proPriceId } from "@/lib/stripe";

export const runtime = "nodejs";

function appOrigin(request: NextRequest) {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    request.nextUrl.origin ||
    "http://localhost:3000"
  );
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !process.env.STRIPE_PRICE_ID_PRO) {
    return NextResponse.json(
      { error: "Stripe is not fully configured" },
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

  const origin = appOrigin(request);
  const stripe = getStripe();
  let customerId = u.stripeCustomerId;
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
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/#pricing`,
    allow_promotion_codes: true,
    client_reference_id: u.id,
    metadata: { userId: u.id },
    subscription_data: {
      metadata: { userId: u.id },
    },
  });

  if (!checkout.url) {
    return NextResponse.json(
      { error: "No checkout URL returned" },
      { status: 500 }
    );
  }
  return NextResponse.json({ url: checkout.url });
}
