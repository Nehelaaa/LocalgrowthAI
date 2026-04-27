import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createOwnerBillingEvent } from "@/lib/owner-billing-events";
import { requireOwnerOrRedirect } from "@/lib/owner";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

const schema = z.object({
  userId: z.string().min(1),
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
    select: { id: true, stripeCustomerId: true, email: true },
  });
  if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!u.stripeCustomerId) {
    return NextResponse.json({ error: "User has no Stripe customer id" }, { status: 400 });
  }

  const stripe = getStripe();
  const charges = await stripe.charges.list({
    customer: u.stripeCustomerId,
    limit: 10,
  });

  const paid = charges.data.find((c) => {
    if (!c.paid) return false;
    const amount = c.amount ?? 0;
    const refunded = c.amount_refunded ?? 0;
    return refunded < amount;
  });
  if (!paid?.id) {
    return NextResponse.json({ error: "No refundable paid charge found" }, { status: 400 });
  }

  const refund = await stripe.refunds.create({ charge: paid.id });

  await createOwnerBillingEvent({
    kind: "refund",
    severity: "warning",
    title: "Owner action: refund issued",
    body: `Refund ${refund.id} created for charge ${paid.id}.`,
    stripeCustomerId: u.stripeCustomerId,
    stripeChargeId: paid.id,
    userId: u.id,
    metadata: { source: "owner_api", refundId: refund.id, status: refund.status },
  });

  return NextResponse.json({
    ok: true,
    refund: { id: refund.id, status: refund.status },
    charge: { id: paid.id },
  });
}
