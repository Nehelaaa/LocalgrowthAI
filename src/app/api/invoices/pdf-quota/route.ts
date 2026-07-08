import { NextRequest, NextResponse } from "next/server";
import { enforceSameOrigin, safeErrorMessage } from "@/lib/api-security";
import { consumeInvoicePdfSlotForUser } from "@/lib/invoice-pdf-quota-core";
import { requireUserForAction } from "@/lib/session-user";

export async function POST(request: NextRequest) {
  try {
    const originErr = enforceSameOrigin(request);
    if (originErr) return originErr;

    const user = await requireUserForAction();
    const result = await consumeInvoicePdfSlotForUser(user);
    if (!result.ok) {
      if (result.code === "LIMIT") {
        return NextResponse.json({ ok: false, code: "LIMIT" }, { status: 403 });
      }
      return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED" || msg === "ACCOUNT_DISABLED") {
      return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
    }
    console.error("[invoices/pdf-quota] POST", e);
    return NextResponse.json({ error: safeErrorMessage() }, { status: 500 });
  }
}
