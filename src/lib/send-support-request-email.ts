/**
 * Delivers signed-in user support requests to the inbox via Resend when RESEND_API_KEY is set.
 * Without Resend in development, logs the payload instead.
 */

import { SUPPORT_INBOX_EMAIL as DEFAULT_SUPPORT_INBOX } from "@/lib/support-inbox";

export type SupportEmailAttachment = {
  filename: string;
  /** Base64-encoded file bytes (Resend `content` field). */
  contentBase64: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendSupportRequestEmail(input: {
  userEmail: string;
  userName: string | null | undefined;
  subject: string;
  message: string;
  attachments?: SupportEmailAttachment[];
}): Promise<{ ok: boolean; loggedToConsole?: boolean }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() ?? "LocalLeadster <onboarding@resend.dev>";
  const to =
    process.env.SUPPORT_INBOX_EMAIL?.trim() || DEFAULT_SUPPORT_INBOX;

  const safeSubject = input.subject.trim().slice(0, 200);
  const safeMessage = input.message.trim().slice(0, 8000);
  const displayName = input.userName?.trim() || input.userEmail;
  const atts = input.attachments ?? [];

  if (!key) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[support] RESEND_API_KEY not set — would send to %s (dev only):\nFrom user: %s <%s>\nSubject: %s\n\n%s\nAttachments: %s",
        to,
        displayName,
        input.userEmail,
        safeSubject,
        safeMessage,
        atts.length ? atts.map((a) => `${a.filename} (${a.contentBase64.length} b64 chars)`).join(", ") : "(none)"
      );
      return { ok: true, loggedToConsole: true };
    }
    return { ok: false };
  }

  const attachNote =
    atts.length > 0
      ? `<p><strong>Attachments</strong>: ${atts.length} file(s) — see this email’s attachments.</p>`
      : "";

  const html = `
<p><strong>From</strong>: ${escapeHtml(displayName)} &lt;${escapeHtml(input.userEmail)}&gt;</p>
<p><strong>Subject</strong>: ${escapeHtml(safeSubject)}</p>
${attachNote}
<hr />
<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;font-size:14px">${escapeHtml(safeMessage)}</pre>
`.trim();

  const payload: Record<string, unknown> = {
    from,
    to: [to],
    reply_to: input.userEmail,
    subject: `[LocalLeadster support] ${safeSubject}`,
    html,
  };

  if (atts.length > 0) {
    payload.attachments = atts.map((a) => ({
      filename: a.filename,
      content: a.contentBase64,
    }));
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[support] Resend error", res.status, body);
    return { ok: false };
  }

  return { ok: true };
}
