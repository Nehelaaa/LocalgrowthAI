import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceSameOrigin, safeErrorMessage } from "@/lib/api-security";
import {
  clearLeadInvoiceDraftForUser,
  persistLeadInvoiceDraftForUser,
} from "@/lib/lead-invoice-draft-persist";
import { leadInvoiceDraftV1Schema } from "@/lib/lead-invoice-draft";
import { requireUserForAction } from "@/lib/session-user";

const saveBodySchema = z.object({
  leadId: z.string().min(1),
  draft: leadInvoiceDraftV1Schema,
});

export async function PUT(request: NextRequest) {
  try {
    const originErr = enforceSameOrigin(request);
    if (originErr) return originErr;

    const user = await requireUserForAction();
    const json = await request.json().catch(() => null);
    const parsed = saveBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid invoice draft." },
        { status: 400 }
      );
    }

    try {
      await persistLeadInvoiceDraftForUser(
        user.id,
        parsed.data.leadId,
        parsed.data.draft
      );
    } catch (e) {
      if (e instanceof Error && e.message === "FORBIDDEN") {
        return NextResponse.json(
          { error: "You can’t update this lead." },
          { status: 403 }
        );
      }
      throw e;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED" || msg === "ACCOUNT_DISABLED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[invoices/draft] PUT", e);
    return NextResponse.json({ error: safeErrorMessage() }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const originErr = enforceSameOrigin(request);
    if (originErr) return originErr;

    const user = await requireUserForAction();
    const leadId = request.nextUrl.searchParams.get("leadId")?.trim();
    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId." }, { status: 400 });
    }

    try {
      await clearLeadInvoiceDraftForUser(user.id, leadId);
    } catch (e) {
      if (e instanceof Error && e.message === "FORBIDDEN") {
        return NextResponse.json(
          { error: "You can’t update this lead." },
          { status: 403 }
        );
      }
      throw e;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED" || msg === "ACCOUNT_DISABLED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[invoices/draft] DELETE", e);
    return NextResponse.json({ error: safeErrorMessage() }, { status: 500 });
  }
}
