"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";
import { randomBytes } from "node:crypto";
import { getAppOriginForRequest } from "@/lib/app-origin";
import { sendPasswordResetEmail } from "@/lib/send-password-reset-email";
import type { Role } from "@prisma/client";

const userIdSchema = z.string().min(1);
const emailSchema = z.string().email();

export async function ownerDisableUser(userId: string) {
  await requireOwnerOrRedirect();
  const id = userIdSchema.parse(userId);
  await prisma.user.update({ where: { id }, data: { disabled: true } });
  revalidatePath("/owner/users");
  revalidatePath(`/owner/users/${id}`);
}

export async function ownerEnableUser(userId: string) {
  await requireOwnerOrRedirect();
  const id = userIdSchema.parse(userId);
  await prisma.user.update({ where: { id }, data: { disabled: false } });
  revalidatePath("/owner/users");
  revalidatePath(`/owner/users/${id}`);
}

export async function ownerSetPlan(userId: string, plan: "free" | "pro") {
  await requireOwnerOrRedirect();
  const id = userIdSchema.parse(userId);
  await prisma.user.update({
    where: { id },
    data: {
      plan,
      subscriptionStatus: plan === "pro" ? "active" : null,
      subscriptionPeriodEnd: null,
    },
  });
  revalidatePath("/owner/users");
  revalidatePath(`/owner/users/${id}`);
}

export async function ownerSetRole(userId: string, role: Role) {
  await requireOwnerOrRedirect();
  const id = userIdSchema.parse(userId);
  const r = z.enum(["ADMIN", "USER"]).parse(role);
  await prisma.user.update({ where: { id }, data: { role: r } });
  revalidatePath("/owner/users");
  revalidatePath(`/owner/users/${id}`);
}

/**
 * Promote an email to owner (ADMIN). If the user doesn't exist yet, create it.
 * Sends a password set/reset link (dev logs to console when RESEND_API_KEY missing).
 */
export async function ownerAddOwnerByEmail(email: string) {
  await requireOwnerOrRedirect();
  const e = emailSchema.parse(String(email).toLowerCase().trim());

  const user = await prisma.user.upsert({
    where: { email: e },
    create: {
      email: e,
      role: "ADMIN",
      plan: "free",
      onboardingComplete: true,
    },
    update: { role: "ADMIN", disabled: false },
    select: { id: true, email: true },
  });

  // Create a one-time password set link (works even if passwordHash is currently null).
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.passwordResetToken.create({
    data: { token: rawToken, userId: user.id, expiresAt },
  });
  const origin = await getAppOriginForRequest();
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await sendPasswordResetEmail(user.email, resetUrl);

  revalidatePath("/owner/users");
}

export async function ownerDeleteUser(userId: string) {
  const session = await requireOwnerOrRedirect();
  const id = userIdSchema.parse(userId);

  if (session.user?.id === id) {
    throw new Error("You cannot delete your own account.");
  }

  const u = await prisma.user.findUnique({
    where: { id },
    select: { id: true, stripeSubscriptionId: true, role: true, disabled: true },
  });
  if (!u) {
    throw new Error("User not found.");
  }
  if (!u.disabled) {
    throw new Error("Only disabled accounts can be deleted. Disable the user first.");
  }
  if (u.role === "ADMIN") {
    throw new Error("Owner (ADMIN) accounts cannot be deleted from the dashboard.");
  }
  if (u.stripeSubscriptionId) {
    throw new Error(
      "This user still has a Stripe subscription on file. Use “Cancel subscription now” (or cancel at period end) in Billing ops, then try delete again.",
    );
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/owner/users");
}

