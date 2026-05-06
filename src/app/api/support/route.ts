import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  enforceSameOrigin,
  rateLimitOr429,
  safeErrorMessage,
} from "@/lib/api-security";
import { auth } from "@/lib/auth";
import {
  botRejectedUserMessage,
  isBotHoneypotTripped,
} from "@/lib/form-bot-guard";
import { prisma } from "@/lib/db";
import {
  SUPPORT_MAX_ATTACHMENTS,
  SUPPORT_MAX_SINGLE_FILE_BYTES,
  SUPPORT_MAX_TOTAL_ATTACHMENT_BYTES,
  isAllowedSupportFile,
  sanitizeSupportFilename,
  supportAttachmentMimeLabel,
} from "@/lib/support-attachments";
import { rateLimitAuthForm } from "@/lib/rate-limit-auth-forms";
import { sendSupportRequestEmail } from "@/lib/send-support-request-email";

const bodySchema = z.object({
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(8000),
});

function validateFiles(files: File[]): string | null {
  if (files.length > SUPPORT_MAX_ATTACHMENTS) {
    return `At most ${SUPPORT_MAX_ATTACHMENTS} files.`;
  }
  let total = 0;
  for (const f of files) {
    if (f.size > SUPPORT_MAX_SINGLE_FILE_BYTES) {
      return `Each file must be under ${Math.floor(SUPPORT_MAX_SINGLE_FILE_BYTES / (1024 * 1024))}MB.`;
    }
    if (!isAllowedSupportFile(f.type, f.name)) {
      return `Unsupported file type. Use ${supportAttachmentMimeLabel()}.`;
    }
    total += f.size;
  }
  if (total > SUPPORT_MAX_TOTAL_ATTACHMENT_BYTES) {
    return `Total attachment size must be under ${Math.floor(SUPPORT_MAX_TOTAL_ATTACHMENT_BYTES / (1024 * 1024))}MB.`;
  }
  return null;
}

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

    const ct = request.headers.get("content-type") ?? "";
    let subject: string;
    let message: string;
    let files: File[] = [];

    if (ct.includes("multipart/form-data")) {
      const form = await request.formData();
      if (isBotHoneypotTripped(form)) {
        return NextResponse.json({ error: botRejectedUserMessage() }, { status: 400 });
      }
      const s = form.get("subject");
      const m = form.get("message");
      if (typeof s !== "string" || typeof m !== "string") {
        return NextResponse.json(
          { error: "Invalid form: subject and message are required." },
          { status: 400 }
        );
      }
      subject = s;
      message = m;
      for (const entry of form.getAll("files")) {
        if (entry instanceof File && entry.size > 0) {
          files.push(entry);
        }
      }
    } else {
      const json = await request.json().catch(() => null);
      if (!json || typeof json !== "object") {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
      const obj = json as Record<string, unknown>;
      if ("_lgai_hp" in obj && String(obj._lgai_hp ?? "").trim().length > 0) {
        return NextResponse.json({ error: botRejectedUserMessage() }, { status: 400 });
      }
      const parsed = bodySchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      subject = parsed.data.subject;
      message = parsed.data.message;
      files = [];
    }

    const parsedFields = bodySchema.safeParse({ subject, message });
    if (!parsedFields.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsedFields.error.flatten() },
        { status: 400 }
      );
    }

    const fileErr = validateFiles(files);
    if (fileErr) {
      return NextResponse.json({ error: fileErr }, { status: 400 });
    }

    if (!rateLimitAuthForm(`support:${session.user.id}`).success) {
      return NextResponse.json(
        { error: "Too many messages sent. Please wait before sending another." },
        { status: 429 }
      );
    }

    const attachments =
      files.length > 0
        ? await Promise.all(
            files.map(async (f) => ({
              filename: sanitizeSupportFilename(f.name),
              contentBase64: Buffer.from(await f.arrayBuffer()).toString("base64"),
            }))
          )
        : undefined;

    const sent = await sendSupportRequestEmail({
      userEmail: user.email,
      userName: user.name,
      subject: parsedFields.data.subject,
      message: parsedFields.data.message,
      attachments,
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
