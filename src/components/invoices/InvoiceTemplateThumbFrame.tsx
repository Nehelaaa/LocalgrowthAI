"use client";

import { memo } from "react";
import { InvoiceDocumentPreview } from "@/components/invoices/InvoiceDocumentPreview";

type Props = {
  templateId: string;
  accentHex: string;
  businessName: string;
  logoDataUrl: string | null;
  documentTitle: string;
  footerPhrase: string;
  /** Taller frame when this template is selected in the grid. */
  enlarged?: boolean;
};

/**
 * Safari-safe thumbnail frame for the template picker grid.
 * Avoids transform + overflow bugs by using `zoom` on WebKit and a fixed preview width.
 */
export const InvoiceTemplateThumbFrame = memo(function InvoiceTemplateThumbFrame({
  templateId,
  accentHex,
  businessName,
  logoDataUrl,
  documentTitle,
  footerPhrase,
  enlarged = false,
}: Props) {
  return (
    <div
      className={
        "relative overflow-hidden border-b border-slate-100/90 bg-gradient-to-b from-slate-50 to-slate-100/50 transition-[height] duration-150 ease-out dark:border-slate-800 dark:from-slate-800/50 dark:to-slate-900/40 " +
        (enlarged ? "h-[9rem] sm:h-[9.75rem]" : "h-[5.25rem] sm:h-[5.75rem]")
      }
    >
      <div
        className={
          "invoice-template-thumb-shell absolute left-1/2 top-0 w-[19rem] max-w-none -translate-x-1/2 " +
          (enlarged ? "invoice-template-thumb-shell--enlarged" : "")
        }
      >
        <InvoiceDocumentPreview
          templateId={templateId}
          accentHex={accentHex}
          businessName={businessName}
          logoDataUrl={logoDataUrl}
          density="compact"
          compact
          thumbnail
          documentTitle={documentTitle}
          footerPhrase={footerPhrase}
        />
      </div>
    </div>
  );
});
