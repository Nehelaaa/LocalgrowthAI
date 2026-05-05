import type { SafeInvoiceRow, SafePaymentActivityRow } from "@/lib/stripe-customer-billing";

export function formatLongDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
}

export function formatInvoiceDate(createdUnix: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(createdUnix * 1000));
}

export function formatMoneyMinor(amountPaid: number, currency: string): string {
  const c = currency.length === 3 ? currency : "USD";
  return (amountPaid / 100).toLocaleString(undefined, { style: "currency", currency: c });
}

export function invoiceDownloadHref(inv: SafeInvoiceRow): string | null {
  return inv.hostedInvoiceUrl ?? inv.invoicePdf;
}

export function paymentStatusBadgeClass(status: SafePaymentActivityRow["statusLabel"]): string {
  if (status === "Refunded") {
    return "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-100";
  }
  if (status === "Partially refunded") {
    return "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}
