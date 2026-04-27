"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOwnerOrRedirect } from "@/lib/owner";

const userIdSchema = z.string().min(1);

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

