import type { Metadata } from "next";
import { InvoiceTemplatesPageClient } from "./InvoiceTemplatesPageClient";

export const metadata: Metadata = {
  title: "Invoice templates",
  description: "Customize invoice PDF layout, logo, and colors for lead invoices.",
};

export default function InvoiceTemplatesPage() {
  return <InvoiceTemplatesPageClient />;
}
