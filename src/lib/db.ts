import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Neon: runtime normally uses pooled `DATABASE_URL`. If you see P1001 to the *-pooler* host locally
 * (firewall/VPN/pooler glitch), set `PRISMA_USE_DIRECT_URL=1` to use `DIRECT_URL` for Prisma queries.
 * Keep pooled `DATABASE_URL` on Vercel/serverless; do not enable direct URL in production unless you know the tradeoffs.
 */
function prismaDatabaseUrl(): string {
  const pooled = process.env.DATABASE_URL?.trim();
  const direct = process.env.DIRECT_URL?.trim();
  if (process.env.PRISMA_USE_DIRECT_URL === "1" && direct) {
    if (process.env.NODE_ENV === "production") {
      const g = globalThis as unknown as { __prismaDirectUrlProdWarned?: boolean };
      if (!g.__prismaDirectUrlProdWarned) {
        g.__prismaDirectUrlProdWarned = true;
        console.warn(
          "[prisma] PRISMA_USE_DIRECT_URL=1 while NODE_ENV=production — use pooled DATABASE_URL on Vercel; this flag is for local dev only."
        );
      }
    }
    return direct;
  }
  if (!pooled) {
    throw new Error("DATABASE_URL is not set.");
  }
  return pooled;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: prismaDatabaseUrl(),
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
