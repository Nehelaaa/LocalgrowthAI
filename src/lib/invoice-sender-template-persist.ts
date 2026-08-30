import { prisma } from "@/lib/db";
import {
  parseInvoiceSenderTemplate,
  type InvoiceSenderTemplate,
} from "@/lib/invoice-sender-template";

export async function getInvoiceSenderTemplateForUser(
  userId: string
): Promise<InvoiceSenderTemplate | null> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { invoiceSenderTemplate: true },
  });
  if (!row || row.invoiceSenderTemplate == null) return null;
  return parseInvoiceSenderTemplate(row.invoiceSenderTemplate);
}

export async function persistInvoiceSenderTemplateForUser(
  userId: string,
  template: InvoiceSenderTemplate
): Promise<void> {
  const normalized = parseInvoiceSenderTemplate(template);
  await prisma.user.update({
    where: { id: userId },
    data: { invoiceSenderTemplate: normalized },
  });
}
