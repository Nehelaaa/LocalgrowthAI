/** Presets for invoice PDF/header copy — kept short for layout safety. */

export const INVOICE_DOCUMENT_TITLE_OPTIONS = [
  { value: "Invoice", label: "Invoice" },
  { value: "Sales invoice", label: "Sales invoice" },
  { value: "Tax invoice", label: "Tax invoice" },
  { value: "Statement", label: "Statement" },
  { value: "Quote", label: "Quote" },
  { value: "Pro forma invoice", label: "Pro forma" },
] as const;

export const INVOICE_FOOTER_PHRASE_OPTIONS = [
  { value: "Thank you for your business.", label: "Thank you" },
  { value: "We appreciate your business.", label: "Appreciation" },
  { value: "Payment due upon receipt.", label: "Due on receipt" },
  { value: "Please remit payment by the due date.", label: "Remit prompt" },
  { value: "Questions? Reply to this invoice.", label: "Questions" },
] as const;

export function sanitizeInvoiceDocumentTitle(raw: string | undefined | null): string {
  const t = (raw ?? "Invoice").trim();
  return t.length > 0 ? t.slice(0, 48) : "Invoice";
}

export function sanitizeInvoiceFooterPhrase(raw: string | undefined | null): string {
  const t = (raw ?? "Thank you for your business.").trim();
  return t.length > 0 ? t.slice(0, 160) : "Thank you for your business.";
}

export function invoiceDocumentTitleForPdfStyle(
  raw: string | undefined | null,
  style: "upper" | "title"
): string {
  const s = sanitizeInvoiceDocumentTitle(raw);
  return style === "upper" ? s.toUpperCase() : s;
}
