import { normalizeEmail } from "@/lib/user-email";

function normalizeOwnerEmailEnvValue(value: string): string {
  let trimmed = value.trim();
  if (trimmed.includes("=")) {
    trimmed = trimmed.split("=").pop()?.trim() ?? trimmed;
  }
  return normalizeEmail(trimmed.replace(/^['"]|['"]$/g, ""));
}

export function ownerEmailsFromEnv(): Set<string> {
  const raw = [
    process.env.OWNER_EMAIL ?? "",
    process.env.OWNER_EMAILS ?? "",
    // Alias for deployments where the owner email was entered as a "username".
    process.env.OWNER_USERNAME ?? "",
    process.env.OWNER_USERNAMES ?? "",
  ].join(",");
  const parts = raw
    .split(",")
    .map((s) => normalizeOwnerEmailEnvValue(s))
    .filter(Boolean);
  return new Set(parts);
}

export function ownerLoginEnvStatus(): {
  hasOwnerEmail: boolean;
  ownerEmailCount: number;
  hasBootstrapPassword: boolean;
} {
  const ownerEmails = ownerEmailsFromEnv();
  const bootstrap = (process.env.OWNER_BOOTSTRAP_PASSWORD ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
  return {
    hasOwnerEmail: ownerEmails.size > 0,
    ownerEmailCount: ownerEmails.size,
    hasBootstrapPassword: bootstrap.length >= 8,
  };
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  const list = ownerEmailsFromEnv();
  if (list.size === 0) return false;
  return list.has(normalizeEmail(email));
}
