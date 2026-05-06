import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  enforceSameOrigin,
  rateLimitOr429,
  safeErrorMessage,
} from "@/lib/api-security";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendSupportRequestEmail } from "@/lib/send-support-request-email";

const bodySchema = z.object({
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(8000),
});

export async function POST(request: NextRequest) {
  try {
    const originErr = enforceSameOrigin(request);
    if (originErr) return originErr;

    const rl = rateLimitOr429(request, "support_contact");
    if (rl) return rl;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const sent = await sendSupportRequestEmail({
      userEmail: user.email,
      userName: user.name,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });

    if (!sent.ok) {
      return NextResponse.json(
        {
          error:
            "Email could not be sent right now. Try again shortly or use the mail link below.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      loggedToConsole: Boolean(sent.loggedToConsole),
    });
  } catch (e) {
    console.error("[support] POST", e);
    return NextResponse.json({ error: safeErrorMessage() }, { status: 500 });
  }
}
