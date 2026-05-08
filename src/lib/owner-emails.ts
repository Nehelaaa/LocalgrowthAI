import { normalizeEmail } from "@/lib/user-email";

function ownerEmailsFromEnv(): Set<string> {
  const raw = `${process.env.OWNER_EMAIL ?? ""},${process.env.OWNER_EMAILS ?? ""}`;
  const parts = raw
    .split(",")
    .map((s) => normalizeEmail(s))
    .filter(Boolean);
  return new Set(parts);
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  const list = ownerEmailsFromEnv();
  if (list.size === 0) return false;
  return list.has(normalizeEmail(email));
}
