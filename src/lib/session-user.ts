import { cache } from "react";
import type { User } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isOwnerSession } from "@/lib/owner";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  // Owner impersonation (server-side). Only takes effect for the configured owner email.
  const canImpersonate = isOwnerSession(session);
  const impId = canImpersonate ? (await cookies()).get("lg_impersonate")?.value : null;
  const actingId = impId && impId.length > 0 ? impId : id;

  const u = await prisma.user.findUnique({ where: { id: actingId } });
  if (!u) return null;
  if (u.disabled) return null;
  return u;
});

export async function getSessionUserOrNull(): Promise<User | null> {
  return getCurrentUser();
}

export async function getSessionUserOrThrow(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) {
    throw new Error("Not authenticated");
  }
  return u;
}

export async function requireUserForAction(): Promise<User> {
  const s = await auth();
  if (!s?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  const canImpersonate = isOwnerSession(s);
  const impId = canImpersonate ? (await cookies()).get("lg_impersonate")?.value : null;
  const actingId = impId && impId.length > 0 ? impId : s.user.id;
  const u = await prisma.user.findUnique({ where: { id: actingId } });
  if (!u) {
    throw new Error("UNAUTHORIZED");
  }
  if (u.disabled) {
    throw new Error("ACCOUNT_DISABLED");
  }
  return u;
}

export async function requireDashboardUser(): Promise<User> {
  const s = await auth();
  if (!s?.user?.id) {
    redirect("/login?callbackUrl=" + encodeURIComponent("/dashboard"));
  }
  const canImpersonate = isOwnerSession(s);
  const impId = canImpersonate ? (await cookies()).get("lg_impersonate")?.value : null;
  const actingId = impId && impId.length > 0 ? impId : s.user.id;
  const u = await prisma.user.findUnique({ where: { id: actingId } });
  if (!u) {
    redirect("/login");
  }
  if (u.disabled) {
    redirect("/unauthorized");
  }
  return u;
}

export async function assertOwnsLead(userId: string, leadId: string): Promise<void> {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId },
  });
  if (!lead) {
    throw new Error("FORBIDDEN");
  }
}

/** Same as `requireUserForAction` — for existing code that imported this name from `auth`. */
export const requireAdmin = requireUserForAction;
