import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createOwnerBillingEvent } from "@/lib/owner-billing-events";
import { requireOwnerOrRedirect } from "@/lib/owner";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

const schema = z.object({
  userId: z.string().min(1),
  mode: z.enum(["cancel_at_period_end", "cancel_now"]),
});

export async function POST(req: Request) {
  await requireOwnerOrRedirect();

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const u = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: {
      id: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      email: true,
    },
  });
  if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!u.stripeCustomerId) {
    return NextResponse.json({ error: "User has no Stripe customer id" }, { status: 400 });
  }
  if (!u.stripeSubscriptionId) {
    return NextResponse.json({ error: "User has no active Stripe subscription id" }, { status: 400 });
  }

  const stripe = getStripe();

  if (parsed.data.mode === "cancel_at_period_end") {
    const sub = await stripe.subscriptions.update(u.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await createOwnerBillingEvent({
      kind: "subscription_updated",
      severity: "warning",
      title: "Owner action: cancel at period end",
      body: `Set cancel_at_period_end on subscription ${sub.id}.`,
      stripeCustomerId: u.stripeCustomerId,
      stripeSubscriptionId: sub.id,
      userId: u.id,
      metadata: { source: "owner_api", mode: parsed.data.mode },
    });

    return NextResponse.json({ ok: true, subscription: { id: sub.id, status: sub.status } });
  }

  const sub = await stripe.subscriptions.cancel(u.stripeSubscriptionId);

  await prisma.user.updateMany({
    where: { id: u.id, stripeCustomerId: u.stripeCustomerId },
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
    title: "Owner action: subscription canceled immediately",
    body: `Canceled subscription ${sub.id} immediately.`,
    stripeCustomerId: u.stripeCustomerId,
    stripeSubscriptionId: sub.id,
    userId: u.id,
    metadata: { source: "owner_api", mode: parsed.data.mode },
  });

  return NextResponse.json({ ok: true, subscription: { id: sub.id, status: sub.status } });
}
