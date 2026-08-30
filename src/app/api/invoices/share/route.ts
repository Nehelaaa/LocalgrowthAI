import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceSameOrigin, safeErrorMessage } from "@/lib/api-security";
import {
  createInvoiceShareForUser,
  invoiceSnapshotShareSchema,
} from "@/lib/invoice-share";
import { requireUserForAction } from "@/lib/session-user";

const bodySchema = z.object({
  leadId: z.string().min(1).optional().nullable(),
  snapshot: invoiceSnapshotShareSchema,
});

export async function POST(request: NextRequest) {
  try {
    const originErr = enforceSameOrigin(request);
    if (originErr) return originErr;

    const user = await requireUserForAction();
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid invoice. Check client name and line items." },
        { status: 400 }
      );
    }

    const hasAmount = parsed.data.snapshot.lineItems.some(
      (li) => li.description.trim() && li.amount > 0
    );
    if (!hasAmount) {
      return NextResponse.json(
        { error: "Add at least one line item with a description and price." },
        { status: 400 }
      );
    }

    try {
      const share = await createInvoiceShareForUser({
        userId: user.id,
        leadId: parsed.data.leadId,
        snapshot: parsed.data.snapshot,
      });
      return NextResponse.json({
        ok: true,
        token: share.token,
        path: share.path,
      });
    } catch (e) {
      if (e instanceof Error && e.message === "FORBIDDEN") {
        return NextResponse.json(
          { error: "You can’t share an invoice for this lead." },
          { status: 403 }
        );
      }
      throw e;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED" || msg === "ACCOUNT_DISABLED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[invoices/share] POST", e);
    return NextResponse.json({ error: safeErrorMessage() }, { status: 500 });
  }
}
