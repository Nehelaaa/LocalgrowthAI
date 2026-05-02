/** Default “from” line when the user has not set a saved business name. */
export function defaultInvoiceCompanyName(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_INVOICE_COMPANY_NAME?.trim()) {
    return process.env.NEXT_PUBLIC_INVOICE_COMPANY_NAME.trim();
  }
  return "Your company name";
}
