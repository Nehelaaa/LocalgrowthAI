"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { getAppOriginForRequest } from "@/lib/app-origin";
import {
  botRejectedUserMessage,
  isBotHoneypotTripped,
} from "@/lib/form-bot-guard";
import { rateLimitAuthForm } from "@/lib/rate-limit-auth-forms";
import { getClientIp } from "@/lib/request-ip";
import { sendPasswordResetEmail } from "@/lib/send-password-reset-email";
import { findUserPasswordResetTarget, normalizeEmail } from "@/lib/user-email";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

const resetSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8, "At least 8 characters").max(200),
    confirm: z.string().max(200),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don’t match", path: ["confirm"] });

export type ForgotPasswordState = {
  error?: string;
  ok?: boolean;
  devLogged?: boolean;
};

export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  if (isBotHoneypotTripped(formData)) {
    return { error: botRejectedUserMessage() };
  }
  const ip = await getClientIp();
  if (!rateLimitAuthForm(`forgot:${ip}`).success) {
    return {
      error: "Too many reset requests. Please wait before trying again.",
    };
  }

  const rawEmail = normalizeEmail(String(formData.get("email") ?? ""));
  const parsed = emailSchema.safeParse({ email: rawEmail });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.email?.[0] ?? "Invalid email" };
  }

  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
  if (process.env.NODE_ENV === "production" && !hasResend) {
    return {
      error:
        "Password reset email isn’t configured yet (missing RESEND_API_KEY). Contact support or sign in with Google.",
    };
  }

  const user = await findUserPasswordResetTarget(prisma, parsed.data.email);

  // OAuth-only accounts have no password — same neutral response as unknown email.
  if (!user?.passwordHash) {
    return { ok: true };
  }

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      token: rawToken,
      userId: user.id,
      expiresAt,
    },
  });

  const origin = await getAppOriginForRequest();
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(rawToken)}`;

  const sent = await sendPasswordResetEmail(user.email, resetUrl);

  if (!sent.ok) {
    await prisma.passwordResetToken.deleteMany({
      where: { token: rawToken },
    });
    return {
      error:
        "Could not send the email. Try again later or contact support if this keeps happening.",
    };
  }

  return {
    ok: true,
    devLogged: Boolean(sent.loggedToConsole),
  };
}

export type ResetPasswordState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

export async function resetPasswordWithToken(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  if (isBotHoneypotTripped(formData)) {
    return { error: botRejectedUserMessage() };
  }
  const ip = await getClientIp();
  if (!rateLimitAuthForm(`reset:${ip}`).success) {
    return {
      error: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const raw = {
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  };

  const parsed = resetSchema.safeParse(raw);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const e of parsed.error.issues) {
      const f = e.path[0] as string;
      if (f) fe[f] = e.message;
    }
    return { fieldErrors: fe, error: "Fix the fields below." };
  }

  const row = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
    include: { user: { select: { id: true } } },
  });

  if (!row || row.expiresAt < new Date()) {
    return {
      error:
        "This reset link is invalid or expired. Request a new one from the sign-in page.",
    };
  }

  const passwordHash = await hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: row.userId },
    }),
  ]);

  return { ok: true };
}
