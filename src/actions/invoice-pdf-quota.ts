"use server";

import { FREE_INVOICE_PDF_LIMIT, hasProEntitlement } from "@/lib/entitlements";
import { prisma } from "@/lib/db";
import { requireUserForAction } from "@/lib/session-user";

export type ConsumeInvoicePdfSlotResult =
  | { ok: true }
  | { ok: false; code: "LIMIT" | "UNAUTHORIZED" };

/**
 * Atomically consumes one invoice PDF slot for Free users before generating a PDF client-side.
 * Pro / grandfathered users skip quota and do not increment.
 */
export async function consumeInvoicePdfSlot(): Promise<ConsumeInvoicePdfSlotResult> {
  try {
    const user = await requireUserForAction();
    if (hasProEntitlement(user)) {
      return { ok: true };
    }
    const updated = await prisma.user.updateMany({
      where: {
        id: user.id,
        lifetimeInvoicePdfsGenerated: { lt: FREE_INVOICE_PDF_LIMIT },
      },
      data: { lifetimeInvoicePdfsGenerated: { increment: 1 } },
    });
    if (updated.count === 0) {
      return { ok: false, code: "LIMIT" };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED" || msg === "ACCOUNT_DISABLED") {
      return { ok: false, code: "UNAUTHORIZED" };
    }
    throw e;
  }
}
