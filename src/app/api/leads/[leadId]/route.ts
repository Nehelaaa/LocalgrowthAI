import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { enforceSameOrigin, safeErrorMessage } from "@/lib/api-security";
import { deleteLeadForUser } from "@/lib/lead-delete";
import { requireUserForAction } from "@/lib/session-user";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  try {
    const originErr = enforceSameOrigin(_request);
    if (originErr) return originErr;

    const user = await requireUserForAction();
    const { leadId } = await context.params;
    if (!leadId?.trim()) {
      return NextResponse.json({ error: "Missing lead id." }, { status: 400 });
    }

    await deleteLeadForUser(user.id, leadId.trim());
    revalidatePath("/dashboard/leads");
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED" || msg === "ACCOUNT_DISABLED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "Lead not found") {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    console.error("[leads] DELETE", e);
    return NextResponse.json({ error: safeErrorMessage() }, { status: 500 });
  }
}
