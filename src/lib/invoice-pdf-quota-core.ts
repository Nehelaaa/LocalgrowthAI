import { FREE_INVOICE_PDF_LIMIT, hasProEntitlement } from "@/lib/entitlements";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

export type ConsumeInvoicePdfSlotResult =
  | { ok: true }
  | { ok: false; code: "LIMIT" | "UNAUTHORIZED" };

export async function consumeInvoicePdfSlotForUser(
  user: User
): Promise<ConsumeInvoicePdfSlotResult> {
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
}
