import { auth } from "@/lib/auth";
import { isOwnerEmail } from "@/lib/owner-emails";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

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

