import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { billingPortalConfigurationId } from "@/lib/stripe-branding";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { enforceSameOrigin, rateLimitOr429 } from "@/lib/api-security";
import { stripeIntegrationPublicError } from "@/lib/stripe-integration-error";

export const runtime = "nodejs";
export const maxDuration = 60;

function appOrigin(request: NextRequest) {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    request.nextUrl.origin ||
    "http://localhost:3000"
  );
}

export async function POST(request: NextRequest) {
  try {
    const originErr = enforceSameOrigin(request);
    if (originErr) return originErr;

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured (STRIPE_SECRET_KEY)." },
        { status: 503 }
      );
    }
    const rl = rateLimitOr429(request, "stripe_portal");
    if (rl) return rl;

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
    const cfg = billingPortalConfigurationId();
    const portal = await stripe.billingPortal.sessions.create({
      customer: u.stripeCustomerId,
      return_url: `${origin}/dashboard/plan?portal=return`,
      ...(cfg ? { configuration: cfg } : {}),
    });

    return NextResponse.json({ url: portal.url });
  } catch (e) {
    console.error("[api/stripe/portal]", e);
    return NextResponse.json({ error: stripeIntegrationPublicError(e) }, { status: 502 });
  }
}
