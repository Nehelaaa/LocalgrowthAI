import { prisma } from "@/lib/db";

/** Deletes the lead (and cascaded outreach / demos), then the linked business if unused. */
export async function deleteLeadForUser(
  userId: string,
  leadId: string
): Promise<void> {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId },
    select: { id: true, businessId: true },
  });
  if (!lead) {
    throw new Error("Lead not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.lead.delete({ where: { id: lead.id } });
    const remaining = await tx.lead.count({
      where: { businessId: lead.businessId },
    });
    if (remaining === 0) {
      await tx.business.delete({ where: { id: lead.businessId } });
    }
  });
}
