import type { PrismaClient } from "@prisma/client";

export function normalizeEmail(email: string | null | undefined): string {
  return String(email ?? "").trim().toLowerCase();
}

/**
 * User.email is normally stored lowercase, but older/manual owner rows may have
 * mixed case. Try the indexed lowercase lookup first, then fall back to a
 * case-insensitive match so `Ahmad@gmail.com` and `ahmad@gmail.com` both work.
 */
export async function findUserByEmail(
  prisma: PrismaClient,
  email: string | null | undefined
) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const exact = await prisma.user.findUnique({ where: { email: normalized } });
  if (exact) return exact;

  return prisma.user.findFirst({
    where: { email: { equals: String(email ?? "").trim(), mode: "insensitive" } },
    orderBy: { createdAt: "asc" },
  });
}

export async function findUserPasswordResetTarget(
  prisma: PrismaClient,
  email: string | null | undefined
) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const exact = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, email: true, passwordHash: true },
  });
  if (exact) return exact;

  return prisma.user.findFirst({
    where: { email: { equals: String(email ?? "").trim(), mode: "insensitive" } },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, passwordHash: true },
  });
}
