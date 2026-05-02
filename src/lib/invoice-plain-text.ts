import { defaultInvoiceCompanyName } from "@/lib/invoice-branding";
import { formatMoneyUSD } from "@/lib/invoice-money";
import type { InvoiceSnapshot } from "@/lib/invoice-types";
import { invoiceTotals } from "@/lib/invoice-types";

export function formatInvoicePlainText(snapshot: InvoiceSnapshot): string {
  const { subtotal, discount, tax, total } = invoiceTotals(snapshot);
  const dateLabel = new Date(snapshot.invoiceDate).toLocaleDateString(undefined, {
    dateStyle: "long",
  });

  const companyName = snapshot.senderBusinessName?.trim() || defaultInvoiceCompanyName();

  const lines: string[] = [
    companyName,
    "",
    `INVOICE ${snapshot.invoiceNumber}`,
    `Date: ${dateLabel}`,
    "",
    "Bill to:",
    snapshot.clientName,
    ...(snapshot.clientAddress.trim() ? snapshot.clientAddress.split(/\r?\n/) : []),
    "",
    "Items:",
  ];

  for (const li of snapshot.lineItems) {
    lines.push(`  • ${li.description} — ${formatMoneyUSD(li.amount)}`);
  }

  lines.push(
    "",
    `Subtotal:     ${formatMoneyUSD(subtotal)}`,
    `Discount:     ${formatMoneyUSD(discount)}`,
    `Tax (${snapshot.taxPercent}%): ${formatMoneyUSD(tax)}`,
    `Total:        ${formatMoneyUSD(total)}`,
    ""
  );

  if (snapshot.notes.trim()) {
    lines.push("Notes:", snapshot.notes.trim(), "");
  }

  return lines.join("\n");
}
