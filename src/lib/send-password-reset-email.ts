/**
 * Sends reset email via Resend when RESEND_API_KEY is set.
 * In development without Resend, logs the URL instead.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<{ ok: boolean; loggedToConsole?: boolean }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() ?? "LocalLeadster <onboarding@resend.dev>";

  if (!key) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[password-reset] RESEND_API_KEY not set — reset link (dev only):\n%s",
        resetUrl
      );
      return { ok: true, loggedToConsole: true };
    }
    return { ok: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your LocalLeadster password",
      html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset password</a> (expires in 1 hour).</p><p>If you didn’t ask for this, you can ignore this email.</p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[password-reset] Resend error", res.status, body);
    return { ok: false };
  }

  return { ok: true };
}
