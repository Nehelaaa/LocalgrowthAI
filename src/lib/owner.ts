import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

function ownerEmailsFromEnv(): Set<string> {
  const raw = `${process.env.OWNER_EMAIL ?? ""},${process.env.OWNER_EMAILS ?? ""}`;
  const parts = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return new Set(parts);
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  const list = ownerEmailsFromEnv();
  if (list.size === 0) return false;
  return list.has(String(email ?? "").trim().toLowerCase());
}

export function isOwnerSession(session: unknown): boolean {
  const s = session as unknown as { user?: { email?: string; role?: Role } } | null;
  const role = (s?.user?.role as Role | undefined) ?? "USER";
  if (role === "ADMIN") return true;
  const email = s?.user?.email?.toLowerCase?.() ?? "";
  return isOwnerEmail(email);
}

/** Gate for owner-only server components/routes. */
export async function requireOwnerOrRedirect() {
  const s = await auth();
  if (!s?.user?.id) {
    redirect("/login?callbackUrl=" + encodeURIComponent("/owner"));
  }
  if (!isOwnerSession(s)) {
    redirect("/unauthorized");
  }
  return s;
}

