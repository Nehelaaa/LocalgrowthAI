import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceSameOrigin, rateLimitOr429, safeErrorMessage } from "@/lib/api-security";
import { botRejectedUserMessage, isBotHoneypotTripped } from "@/lib/form-bot-guard";
import { sendSupportRequestEmail } from "@/lib/send-support-request-email";
import {
  SUPPORT_MAX_ATTACHMENTS,
  SUPPORT_MAX_SINGLE_FILE_BYTES,
  SUPPORT_MAX_TOTAL_ATTACHMENT_BYTES,
  isAllowedSupportFile,
  sanitizeSupportFilename,
  supportAttachmentMimeLabel,
} from "@/lib/support-attachments";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(200),
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

    // Stricter than generic APIs; still best-effort (in-memory per instance).
    const rl = rateLimitOr429(request, "contact_form");
    if (rl) return rl;

    const ct = request.headers.get("content-type") ?? "";
    let email: string;
    let subject: string;
    let message: string;
    let files: File[] = [];

    if (ct.includes("multipart/form-data")) {
      const form = await request.formData();
      if (isBotHoneypotTripped(form)) {
        return NextResponse.json({ error: botRejectedUserMessage() }, { status: 400 });
      }
      const e = form.get("email");
      const s = form.get("subject");
      const m = form.get("message");
      if (typeof e !== "string" || typeof s !== "string" || typeof m !== "string") {
        return NextResponse.json(
          { error: "Invalid form: email, subject, and message are required." },
          { status: 400 }
        );
      }
      email = e;
      subject = s;
      message = m;
      for (const entry of form.getAll("files")) {
        if (entry instanceof File && entry.size > 0) files.push(entry);
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
      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      email = parsed.data.email;
      subject = parsed.data.subject;
      message = parsed.data.message;
      files = [];
    }

    const parsedFields = schema.safeParse({ email, subject, message });
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
      userEmail: parsedFields.data.email,
      userName: null,
      subject: `Website contact: ${parsedFields.data.subject}`,
      message: parsedFields.data.message,
      attachments,
    });

    if (!sent.ok) {
      return NextResponse.json(
        { error: "Could not send right now. Please try again in a moment." },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true, loggedToConsole: Boolean(sent.loggedToConsole) });
  } catch (e) {
    console.error("[contact] POST", e);
    return NextResponse.json({ error: safeErrorMessage() }, { status: 500 });
  }
}

