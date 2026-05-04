export type InvoiceLineItem = {
  id: string;
  description: string;
  /** Amount in major currency units (e.g. USD dollars) */
  amount: number;
};

export type InvoiceSnapshot = {
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  clientAddress: string;
  lineItems: InvoiceLineItem[];
  notes: string;
  taxPercent: number;
  /** Flat discount in major currency units, applied before tax */
  discountAmount: number;
  /** Your business name (saved template); empty uses env default in exports */
  senderBusinessName?: string;
  /** JPEG/PNG data URL for letterhead logo */
  senderLogoDataUrl?: string | null;
  /** Visual template for PDF + preview (see `invoice-templates.ts`) */
  invoiceTemplateId?: string;
  /** Accent color #RRGGBB */
  invoiceAccentHex?: string;
  /** Row / padding density in PDF */
  invoiceLayoutDensity?: "compact" | "comfortable";
};

export function invoiceTotals(s: Pick<InvoiceSnapshot, "lineItems" | "taxPercent" | "discountAmount">): {
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
} {
  const subtotal = s.lineItems.reduce((sum, li) => sum + (Number.isFinite(li.amount) ? li.amount : 0), 0);
  const discount = Math.min(Math.max(0, s.discountAmount), subtotal);
  const taxable = subtotal - discount;
  const tax = taxable * (Math.max(0, s.taxPercent) / 100);
  const total = taxable + tax;
  return { subtotal, discount, taxable, tax, total };
}
