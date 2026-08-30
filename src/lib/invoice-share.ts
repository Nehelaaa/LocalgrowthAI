import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { InvoiceSnapshot } from "@/lib/invoice-types";

const SHARE_TTL_DAYS = 90;

const lineItemSchema = z.object({
  id: z.string().max(80).optional(),
  description: z.string().max(500),
  amount: z.number().finite().min(0).max(1_000_000_000),
});

export const invoiceSnapshotShareSchema = z.object({
  invoiceNumber: z.string().trim().min(1).max(64),
  invoiceDate: z.string().trim().min(1).max(32),
  clientName: z.string().trim().min(1).max(200),
  clientAddress: z.string().max(1000).default(""),
  lineItems: z.array(lineItemSchema).min(1).max(100),
  notes: z.string().max(4000).default(""),
  taxPercent: z.number().finite().min(0).max(100).default(0),
  discountAmount: z.number().finite().min(0).max(1_000_000_000).default(0),
  senderBusinessName: z.string().max(200).optional(),
  senderLogoDataUrl: z
    .string()
    .max(900_000)
    .nullable()
    .optional()
    .refine(
      (v) =>
        v == null ||
        v === "" ||
        /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(v),
      { message: "Invalid logo" }
    ),
  invoiceTemplateId: z.string().max(40).optional(),
  invoiceAccentHex: z.string().max(16).optional(),
  invoiceLayoutDensity: z.enum(["compact", "comfortable"]).optional(),
  invoiceDocumentTitle: z.string().max(48).optional(),
  invoiceFooterPhrase: z.string().max(160).optional(),
});

export type InvoiceSnapshotShareInput = z.infer<typeof invoiceSnapshotShareSchema>;

export function newInvoiceShareToken(): string {
  return randomBytes(18).toString("base64url");
}

export function toPublicInvoiceSnapshot(
  raw: InvoiceSnapshotShareInput
): InvoiceSnapshot {
  return {
    invoiceNumber: raw.invoiceNumber.trim(),
    invoiceDate: raw.invoiceDate.trim(),
    clientName: raw.clientName.trim(),
    clientAddress: (raw.clientAddress ?? "").trim(),
    lineItems: raw.lineItems.map((li, i) => ({
      id: li.id?.trim() || `li_${i}`,
      description: li.description.trim(),
      amount: li.amount,
    })),
    notes: (raw.notes ?? "").trim(),
    taxPercent: raw.taxPercent ?? 0,
    discountAmount: raw.discountAmount ?? 0,
    senderBusinessName: raw.senderBusinessName?.trim() || undefined,
    senderLogoDataUrl: raw.senderLogoDataUrl || null,
    invoiceTemplateId: raw.invoiceTemplateId,
    invoiceAccentHex: raw.invoiceAccentHex,
    invoiceLayoutDensity: raw.invoiceLayoutDensity,
    invoiceDocumentTitle: raw.invoiceDocumentTitle,
    invoiceFooterPhrase: raw.invoiceFooterPhrase,
  };
}

export async function createInvoiceShareForUser(opts: {
  userId: string;
  leadId?: string | null;
  snapshot: InvoiceSnapshotShareInput;
}): Promise<{ token: string; path: string }> {
  if (opts.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: opts.leadId, userId: opts.userId },
      select: { id: true },
    });
    if (!lead) {
      throw new Error("FORBIDDEN");
    }
  }

  const snapshot = toPublicInvoiceSnapshot(opts.snapshot);
  const token = newInvoiceShareToken();
  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + SHARE_TTL_DAYS);

  await prisma.invoiceShare.create({
    data: {
      token,
      userId: opts.userId,
      leadId: opts.leadId ?? null,
      snapshot,
      expiresAt,
    },
  });

  return { token, path: `/i/${token}` };
}

export async function getValidInvoiceShareByToken(
  token: string
): Promise<{ snapshot: InvoiceSnapshot } | null> {
  const t = token.trim();
  if (!t || t.length > 64) return null;

  const row = await prisma.invoiceShare.findUnique({
    where: { token: t },
    select: { snapshot: true, expiresAt: true },
  });
  if (!row) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;

  const parsed = invoiceSnapshotShareSchema.safeParse(row.snapshot);
  if (!parsed.success) return null;
  return { snapshot: toPublicInvoiceSnapshot(parsed.data) };
}

/** Optional fingerprint for cache keys (not security). */
export function invoiceShareCacheKey(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 16);
}
