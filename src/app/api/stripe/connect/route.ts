import { NextRequest, NextResponse } from "next/server";
import { enforceSameOrigin, rateLimitOr429, safeErrorMessage } from "@/lib/api-security";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/session-user";
import { isStripeConfigured } from "@/lib/stripe";
import {
  canUseStripeConnect,
  connectStatusLabel,
} from "@/lib/stripe-connect-entitlements";
import {
  createConnectAccountOnboardingLink,
  createConnectExpressDashboardLink,
  disconnectConnectAccount,
  ensureConnectExpressAccount,
  syncConnectAccountFromStripe,
} from "@/lib/stripe-connect";
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

export async function GET() {
  try {
    const user = await requireUserForAction();
    const fresh = (await syncConnectAccountFromStripe(user.id)) ?? user;
    return NextResponse.json({
      ok: true,
      configured: isStripeConfigured(),
      canUse: canUseStripeConnect(fresh),
      status: connectStatusLabel(fresh),
      accountId: fresh.stripeConnectAccountId,
      detailsSubmitted: fresh.stripeConnectDetailsSubmitted,
      chargesEnabled: fresh.stripeConnectChargesEnabled,
      payoutsEnabled: fresh.stripeConnectPayoutsEnabled,
      onboardedAt: fresh.stripeConnectOnboardedAt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED" || msg === "ACCOUNT_DISABLED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[stripe/connect] GET", e);
    return NextResponse.json({ error: safeErrorMessage() }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const originErr = enforceSameOrigin(request);
    if (originErr) return originErr;
    const rl = rateLimitOr429(request, "stripe_connect");
    if (rl) return rl;

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured on the server." },
        { status: 503 }
      );
    }

    const user = await requireUserForAction();
    const body = (await request.json().catch(() => ({}))) as { action?: string };
    const action = body.action ?? "onboard";

    if (action === "disconnect") {
      await disconnectConnectAccount(user.id);
      return NextResponse.json({ ok: true, disconnected: true });
    }

    if (action === "dashboard") {
      const u = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      if (!u.stripeConnectAccountId || !u.stripeConnectChargesEnabled) {
        return NextResponse.json(
          { error: "Finish Stripe onboarding before opening the payouts dashboard." },
          { status: 400 }
        );
      }
      const url = await createConnectExpressDashboardLink(u.stripeConnectAccountId);
      return NextResponse.json({ ok: true, url });
    }

    // onboard / refresh
    if (!canUseStripeConnect(user)) {
      return NextResponse.json(
        {
          error: "Invoice payments require Pro. Upgrade on Plan & billing, then connect Stripe.",
          code: "PRO_REQUIRED",
        },
        { status: 403 }
      );
    }

    const u = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const accountId = await ensureConnectExpressAccount(u);
    const origin = appOrigin(request);
    const url = await createConnectAccountOnboardingLink({
      accountId,
      refreshUrl: `${origin}/dashboard/payments?connect=refresh`,
      returnUrl: `${origin}/dashboard/payments?connect=return`,
    });
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED" || msg === "ACCOUNT_DISABLED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "PRO_REQUIRED") {
      return NextResponse.json(
        { error: "Invoice payments require Pro.", code: "PRO_REQUIRED" },
        { status: 403 }
      );
    }
    console.error("[stripe/connect] POST", e);
    return NextResponse.json({ error: stripeIntegrationPublicError(e) }, { status: 502 });
  }
}
