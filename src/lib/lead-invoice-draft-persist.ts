import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertOwnsLead } from "@/lib/session-user";
import {
  leadInvoiceDraftV1Schema,
  type LeadInvoiceDraftV1,
} from "@/lib/lead-invoice-draft";

export async function persistLeadInvoiceDraftForUser(
  userId: string,
  leadId: string,
  draft: LeadInvoiceDraftV1
): Promise<void> {
  const parsed = leadInvoiceDraftV1Schema.safeParse(draft);
  if (!parsed.success) {
    throw new Error("Invalid invoice draft.");
  }
  await assertOwnsLead(userId, leadId);
  await prisma.lead.update({
    where: { id: leadId, userId },
    data: { invoiceDraft: parsed.data },
  });
}

export async function clearLeadInvoiceDraftForUser(
  userId: string,
  leadId: string
): Promise<void> {
  await assertOwnsLead(userId, leadId);
  await prisma.lead.update({
    where: { id: leadId, userId },
    data: { invoiceDraft: Prisma.DbNull },
  });
}
