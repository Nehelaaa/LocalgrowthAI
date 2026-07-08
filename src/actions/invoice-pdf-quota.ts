"use server";

import { consumeInvoicePdfSlotForUser } from "@/lib/invoice-pdf-quota-core";
import { requireUserForAction } from "@/lib/session-user";

export type { ConsumeInvoicePdfSlotResult } from "@/lib/invoice-pdf-quota-core";

/**
 * Atomically consumes one invoice PDF slot for Free users before generating a PDF client-side.
 * Pro / grandfathered users skip quota and do not increment.
 */
export async function consumeInvoicePdfSlot() {
  try {
    const user = await requireUserForAction();
    return await consumeInvoicePdfSlotForUser(user);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED" || msg === "ACCOUNT_DISABLED") {
      return { ok: false as const, code: "UNAUTHORIZED" as const };
    }
    throw e;
  }
}
