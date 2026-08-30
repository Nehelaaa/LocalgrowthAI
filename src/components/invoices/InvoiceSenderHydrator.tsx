"use client";

import { useEffect } from "react";
import { hydrateInvoiceSenderTemplate } from "@/lib/invoice-sender-sync";

/** Pulls account invoice branding (incl. logo) into localStorage for this device. */
export function InvoiceSenderHydrator() {
  useEffect(() => {
    void hydrateInvoiceSenderTemplate();
  }, []);
  return null;
}
