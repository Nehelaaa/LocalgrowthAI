import { handlers } from "@/lib/auth";

/** Prisma + SQLite must run on Node; avoid any Edge inference for OAuth callbacks. */
export const runtime = "nodejs";

export const { GET, POST } = handlers;
