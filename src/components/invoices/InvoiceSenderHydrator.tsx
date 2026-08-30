"use client";

import { useEffect } from "react";
import type { InvoiceSenderTemplate } from "@/lib/invoice-sender-template";
import {
  applyServerInvoiceSenderTemplate,
  hydrateInvoiceSenderTemplate,
} from "@/lib/invoice-sender-sync";

/** Pulls account invoice branding (incl. logo) into localStorage for this device. */
export function InvoiceSenderHydrator({
  serverTemplate,
}: {
  serverTemplate?: InvoiceSenderTemplate | null;
}) {
  useEffect(() => {
    if (serverTemplate) {
      applyServerInvoiceSenderTemplate(serverTemplate);
    }
    void hydrateInvoiceSenderTemplate();
  }, [serverTemplate]);
  return null;
}
