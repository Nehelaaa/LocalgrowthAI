/** Client-safe SMS helpers for sharing invoice view links. */

/** Digits for sms: URIs; keeps a leading + when present. */
export function normalizeSmsPhone(raw: string | null | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  const hasPlus = t.startsWith("+");
  const digits = t.replace(/\D/g, "");
  if (!digits) return "";
  return hasPlus ? `+${digits}` : digits;
}

export function buildInvoiceSmsHref(phone: string | undefined, body: string): string {
  const encoded = encodeURIComponent(body);
  const to = normalizeSmsPhone(phone);
  if (to) return `sms:${to}?body=${encoded}`;
  return `sms:?body=${encoded}`;
}

export function buildInvoiceSmsBody(opts: {
  businessName: string;
  invoiceNumber: string;
  viewUrl: string;
}): string {
  const from = opts.businessName.trim() || "us";
  return `Hi! Here's your invoice ${opts.invoiceNumber} from ${from}: ${opts.viewUrl}`;
}
