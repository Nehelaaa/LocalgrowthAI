import { z } from "zod";

/** Persisted per-lead invoice form (excludes invoice # / date — those stay fresh each time). */
export const leadInvoiceDraftV1Schema = z.object({
  v: z.literal(1),
  clientName: z.string(),
  clientAddress: z.string(),
  lineItems: z.array(
    z.object({
      description: z.string(),
      amount: z.number(),
    })
  ),
  notes: z.string(),
  taxPercent: z.number(),
  discountAmount: z.number(),
});

export type LeadInvoiceDraftV1 = z.infer<typeof leadInvoiceDraftV1Schema>;

export function parseLeadInvoiceDraft(raw: unknown): LeadInvoiceDraftV1 | null {
  const r = leadInvoiceDraftV1Schema.safeParse(raw);
  return r.success ? r.data : null;
}

export function serializeLeadInvoiceDraftStable(d: LeadInvoiceDraftV1): string {
  return JSON.stringify({
    v: d.v,
    clientName: d.clientName,
    clientAddress: d.clientAddress,
    lineItems: d.lineItems.map((li) => ({
      description: li.description,
      amount: Number.isFinite(li.amount) ? li.amount : 0,
    })),
    notes: d.notes,
    taxPercent: Number.isFinite(d.taxPercent) ? d.taxPercent : 0,
    discountAmount: Number.isFinite(d.discountAmount) ? d.discountAmount : 0,
  });
}
