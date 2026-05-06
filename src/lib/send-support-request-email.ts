/**
 * Delivers signed-in user support requests to the inbox via Resend when RESEND_API_KEY is set.
 * Without Resend in development, logs the payload instead.
 */

import { SUPPORT_INBOX_EMAIL as DEFAULT_SUPPORT_INBOX } from "@/lib/support-inbox";

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
}): Promise<{ ok: boolean; loggedToConsole?: boolean }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() ?? "LocalLeadster <onboarding@resend.dev>";
  const to =
    process.env.SUPPORT_INBOX_EMAIL?.trim() || DEFAULT_SUPPORT_INBOX;

  const safeSubject = input.subject.trim().slice(0, 200);
  const safeMessage = input.message.trim().slice(0, 8000);
  const displayName = input.userName?.trim() || input.userEmail;

  if (!key) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[support] RESEND_API_KEY not set — would send to %s (dev only):\nFrom user: %s <%s>\nSubject: %s\n\n%s",
        to,
        displayName,
        input.userEmail,
        safeSubject,
        safeMessage
      );
      return { ok: true, loggedToConsole: true };
    }
    return { ok: false };
  }

  const html = `
<p><strong>From</strong>: ${escapeHtml(displayName)} &lt;${escapeHtml(input.userEmail)}&gt;</p>
<p><strong>Subject</strong>: ${escapeHtml(safeSubject)}</p>
<hr />
<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;font-size:14px">${escapeHtml(safeMessage)}</pre>
`.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: input.userEmail,
      subject: `[LocalLeadster support] ${safeSubject}`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[support] Resend error", res.status, body);
    return { ok: false };
  }

  return { ok: true };
}
