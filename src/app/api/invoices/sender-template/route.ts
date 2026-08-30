import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceSameOrigin, safeErrorMessage } from "@/lib/api-security";
import {
  getInvoiceSenderTemplateForUser,
  persistInvoiceSenderTemplateForUser,
} from "@/lib/invoice-sender-template-persist";
import { parseInvoiceSenderTemplate } from "@/lib/invoice-sender-template";
import { requireUserForAction } from "@/lib/session-user";

const putBodySchema = z.object({
  template: z.unknown(),
});

export async function GET() {
  try {
    const user = await requireUserForAction();
    const template = await getInvoiceSenderTemplateForUser(user.id);
    return NextResponse.json({
      ok: true,
      template,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED" || msg === "ACCOUNT_DISABLED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[invoices/sender-template] GET", e);
    return NextResponse.json({ error: safeErrorMessage() }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const originErr = enforceSameOrigin(request);
    if (originErr) return originErr;

    const user = await requireUserForAction();
    const json = await request.json().catch(() => null);
    const parsed = putBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid branding payload." }, { status: 400 });
    }

    const template = parseInvoiceSenderTemplate(parsed.data.template);
    if (template.logoDataUrl && template.logoDataUrl.length > 900_000) {
      return NextResponse.json(
        { error: "Logo is too large. Use a smaller PNG or JPEG." },
        { status: 400 }
      );
    }

    await persistInvoiceSenderTemplateForUser(user.id, template);
    return NextResponse.json({ ok: true, template });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED" || msg === "ACCOUNT_DISABLED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[invoices/sender-template] PUT", e);
    return NextResponse.json({ error: safeErrorMessage() }, { status: 500 });
  }
}
