import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitOr429, safeErrorMessage } from "@/lib/api-security";
import { isStripeConfigured } from "@/lib/stripe";
import { createInvoiceShareCheckoutSession } from "@/lib/stripe-connect";
import { stripeIntegrationPublicError } from "@/lib/stripe-integration-error";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  token: z.string().trim().min(8).max(64),
});

function appOrigin(request: NextRequest) {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    request.nextUrl.origin ||
    "http://localhost:3000"
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Payments are temporarily unavailable." },
        { status: 503 }
      );
    }
    const rl = rateLimitOr429(request, "invoice_pay");
    if (rl) return rl;

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid invoice link." }, { status: 400 });
    }

    const { url, sessionId } = await createInvoiceShareCheckoutSession({
      shareToken: parsed.data.token,
      origin: appOrigin(request),
    });
    return NextResponse.json({ ok: true, url, sessionId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const map: Record<string, { status: number; error: string }> = {
      NOT_FOUND: { status: 404, error: "Invoice not found." },
      EXPIRED: { status: 410, error: "This invoice link has expired." },
      ALREADY_PAID: { status: 409, error: "This invoice was already paid." },
      REFUNDED: { status: 409, error: "This payment was refunded." },
      NOT_PAYABLE: {
        status: 400,
        error: "Online payment is not available for this invoice.",
      },
      AMOUNT_TOO_LOW: {
        status: 400,
        error: "Amount is below the minimum for card payments.",
      },
      SELLER_NOT_READY: {
        status: 400,
        error: "The seller is not accepting card payments yet.",
      },
      STRIPE_NOT_CONFIGURED: {
        status: 503,
        error: "Payments are temporarily unavailable.",
      },
    };
    if (map[msg]) {
      return NextResponse.json({ error: map[msg].error, code: msg }, { status: map[msg].status });
    }
    console.error("[invoices/pay] POST", e);
    return NextResponse.json(
      { error: stripeIntegrationPublicError(e) || safeErrorMessage() },
      { status: 502 }
    );
  }
}
