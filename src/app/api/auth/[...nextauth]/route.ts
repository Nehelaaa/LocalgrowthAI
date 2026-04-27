import { handlers } from "@/lib/auth";

/** Prisma + SQLite must run on Node; avoid any Edge inference for OAuth callbacks. */
export const runtime = "nodejs";

/** Allow cold DB + OAuth token exchange on Vercel without timing out mid-callback. */
export const maxDuration = 60;

export const { GET, POST } = handlers;
