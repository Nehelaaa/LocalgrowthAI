import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

function ownerEmail(): string | null {
  const e = process.env.OWNER_EMAIL;
  if (!e) return null;
  const trimmed = e.trim().toLowerCase();
  return trimmed.length ? trimmed : null;
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  const target = ownerEmail();
  if (!target) return false;
  return String(email ?? "").trim().toLowerCase() === target;
}

export function isOwnerSession(session: unknown): boolean {
  const email = (session as unknown as { user?: { email?: string } } | null)
    ?.user?.email?.toLowerCase?.() ?? "";
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

