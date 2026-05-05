import { defaultInvoiceCompanyName } from "@/lib/invoice-branding";
import { formatMoneyUSD } from "@/lib/invoice-money";
import {
  getInvoiceTemplate,
  hexToRgb,
  normalizeHexColor,
  normalizeInvoiceTemplateId,
} from "@/lib/invoice-templates";
import type { InvoiceSnapshot } from "@/lib/invoice-types";
import { invoiceTotals } from "@/lib/invoice-types";

function cellPad(snapshot: InvoiceSnapshot): number {
  return snapshot.invoiceLayoutDensity === "compact" ? 2 : 3;
}

function detectImageFormat(dataUrl: string | null | undefined): "PNG" | "JPEG" {
  if (dataUrl?.includes("image/png")) return "PNG";
  return "JPEG";
}

export async function generateInvoicePdfBlob(snapshot: InvoiceSnapshot): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = margin;

  const templateId = normalizeInvoiceTemplateId(snapshot.invoiceTemplateId);
  const tplMeta = getInvoiceTemplate(templateId);
  const accentHex = normalizeHexColor(snapshot.invoiceAccentHex, tplMeta.defaultAccentHex);
  const accent = hexToRgb(accentHex);

  const brand = snapshot.senderBusinessName?.trim() || defaultInvoiceCompanyName();
  const { subtotal, discount, tax, total } = invoiceTotals(snapshot);
  const invoiceDateParsed = new Date(snapshot.invoiceDate);
  const dateLabel = invoiceDateParsed.toLocaleDateString(undefined, {
    dateStyle: "long",
  });
  /** Matches InvoiceDocumentPreview Editorial meta (“APR 22, 2026”). */
  const editorialShortDateUpper = invoiceDateParsed
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();

  const pad = cellPad(snapshot);
  const logoFmt = detectImageFormat(snapshot.senderLogoDataUrl);

  const drawLogo = (left: number, top: number, maxW: number, maxH: number): number => {
    if (snapshot.senderLogoDataUrl) {
      try {
        const props = doc.getImageProperties(snapshot.senderLogoDataUrl);
        let imgW = maxW;
        let imgH = (props.height * imgW) / props.width;
        if (imgH > maxH) {
          imgH = maxH;
          imgW = (props.width * imgH) / props.height;
        }
        doc.addImage(snapshot.senderLogoDataUrl, logoFmt, left, top, imgW, imgH);
        return top + imgH;
      } catch {
        /* fall through */
      }
    }
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(left, top, maxW, maxH, 1.5, 1.5, "F");
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text("LOGO", left + maxW / 2 - 4, top + maxH / 2 + 1.5);
    return top + maxH;
  };

  if (templateId === "accentBar") {
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(0, 0, 4, pageH, "F");
  }

  if (templateId === "mono") {
    doc.setFont("helvetica", "normal");
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, pageW, 26, "F");
    const logoBottom = drawLogo(margin, 6, 22, 14);
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(brand, margin + 28, 14);
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 210);
    doc.text("INVOICE", pageW - margin, 10, { align: "right" });
    doc.text(snapshot.invoiceNumber, pageW - margin, 16, { align: "right" });
    doc.text(dateLabel, pageW - margin, 22, { align: "right" });
    y = Math.max(30, logoBottom + 8);
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 8;
  } else if (templateId === "editorial") {
    doc.setFont("times", "normal");
    doc.setFontSize(20);
    doc.setTextColor(41, 37, 36);
    doc.text("INVOICE", pageW / 2, y + 8, { align: "center" });
    doc.setFont("times", "italic");
    doc.setFontSize(11);
    doc.setTextColor(87, 83, 78);
    doc.text(brand, pageW / 2, y + 16, { align: "center" });
    doc.setFont("times", "normal");
    y += 22;
    const lb = drawLogo(pageW / 2 - 14, y, 28, 14);
    doc.setFont("times", "normal");
    y = lb + 6;
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 113, 108);
    doc.text(`${snapshot.invoiceNumber} · ${editorialShortDateUpper}`, pageW / 2, y, { align: "center" });
    y += 8;
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(0.35);
    doc.line(margin + 24, y, pageW - margin - 24, y);
    y += 8;
  } else if (templateId === "ledger") {
    doc.setFont("helvetica", "normal");
    doc.setFillColor(255, 251, 235);
    doc.rect(0, 0, pageW, 42, "F");
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.35);
    doc.line(margin, 38, pageW - margin, 38);
    const logoBottom = drawLogo(margin, 8, 26, 16);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("REMITTANCE", margin, 12);
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text(brand.toUpperCase(), margin + 32, 22);
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.text(snapshot.invoiceNumber, pageW - margin, 14, { align: "right" });
    doc.text(dateLabel.replace(/,/g, ""), pageW - margin, 20, { align: "right" });
    doc.setFont("helvetica", "normal");
    y = Math.max(42, logoBottom + 10);
  } else if (templateId === "accentBar") {
    doc.setFont("helvetica", "normal");
    const headerTop = y;
    const logoBottom = drawLogo(margin + 4, headerTop, 30, 16);
    doc.setFontSize(17);
    doc.setTextColor(15, 23, 42);
    const metaBoxW = 52;
    const metaGap = 6;
    const brandMaxW = Math.max(36, pageW - margin * 2 - 40 - metaBoxW - metaGap);
    doc.text(brand, margin + 40, headerTop + 10, { maxWidth: brandMaxW });
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(pageW - margin - 52, headerTop - 1, 52, 22, 2, 2, "F");
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(pageW - margin - 52, headerTop - 1, 52, 22, 2, 2, "S");
    doc.setFontSize(7);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text("DUE ON RECEIPT", pageW - margin - 26, headerTop + 4, { align: "center" });
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(snapshot.invoiceNumber, pageW - margin - 26, headerTop + 11, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(dateLabel, pageW - margin - 26, headerTop + 17, { align: "center" });
    y = Math.max(headerTop + 26, logoBottom + 8);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin + 4, y, pageW - margin, y);
    y += 8;
  } else {
    /* minimal */
    doc.setFont("helvetica", "normal");
    const headerTop = y;
    const logoBottom = drawLogo(margin, headerTop, 32, 16);
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text(brand, margin + 36, headerTop + 10);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Professional invoice", margin + 36, headerTop + 16);
    doc.setFontSize(10);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text("INVOICE", pageW - margin, headerTop + 4, { align: "right" });
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(snapshot.invoiceNumber, pageW - margin, headerTop + 11, { align: "right" });
    doc.text(dateLabel, pageW - margin, headerTop + 17, { align: "right" });
    y = Math.max(headerTop + 22, logoBottom + 6);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageW - margin, y);
    y += 8;
  }

  /* Bill to */
  if (templateId === "ledger") {
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.25);
    doc.rect(margin, y, pageW - margin * 2, 22);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin + 0.3, y + 0.3, pageW - margin * 2 - 0.6, 21.4, "F");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("PAY TO", margin + 3, y + 6);
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(snapshot.clientName, margin + 3, y + 12);
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const addrOne = doc.splitTextToSize(snapshot.clientAddress || "—", pageW - margin * 2 - 10);
    doc.text(addrOne, margin + 3, y + 17);
    doc.setFont("helvetica", "normal");
    y += 28;
  } else if (templateId === "editorial") {
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 113, 108);
    doc.text("Bill to", margin, y);
    y += 5;
    doc.setFontSize(11);
    doc.setTextColor(41, 37, 36);
    doc.text(snapshot.clientName, margin, y);
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(87, 83, 78);
    const addrLines = doc.splitTextToSize(snapshot.clientAddress || "—", pageW - margin * 2 - 50);
    doc.text(addrLines, margin, y);
    y += addrLines.length * 5 + 8;
  } else {
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Bill to", margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(snapshot.clientName, margin, y);
    y += 5;
    const addrLines = doc.splitTextToSize(snapshot.clientAddress || "—", pageW - margin * 2 - 40);
    doc.text(addrLines, margin, y);
    y += addrLines.length * 5 + 8;
  }

  const tableBody =
    templateId === "ledger"
      ? snapshot.lineItems.map((li, i) => [
          String(i + 1),
          li.description.trim() || "—",
          formatMoneyUSD(li.amount),
        ])
      : snapshot.lineItems.map((li) => [li.description.trim() || "—", formatMoneyUSD(li.amount)]);

  const head =
    templateId === "ledger"
      ? [["#", "Service", "Amount"]]
      : [["Description", "Amount"]];

  const headFill: [number, number, number] =
    templateId === "mono"
      ? [63, 63, 70]
      : templateId === "ledger"
        ? [15, 23, 42]
        : [accent[0], accent[1], accent[2]];

  const tableTheme =
    templateId === "ledger" ? "grid" : templateId === "editorial" ? "plain" : "striped";

  const tableFont: "helvetica" | "times" | "courier" =
    templateId === "editorial" ? "times" : templateId === "ledger" ? "courier" : "helvetica";

  const columnStyles: Record<number, { cellWidth?: number; halign?: "left" | "right" }> =
    templateId === "ledger"
      ? {
          0: { cellWidth: 12, halign: "left" },
          1: { cellWidth: pageW - margin * 2 - 12 - 36 },
          2: { halign: "right", cellWidth: 36 },
        }
      : {
          0: { cellWidth: pageW - margin * 2 - 36 },
          1: { halign: "right", cellWidth: 36 },
        };

  autoTable(doc, {
    startY: y,
    head,
    body: tableBody,
    theme: tableTheme,
    headStyles: {
      fillColor: headFill,
      textColor: templateId === "ledger" ? 255 : 255,
      fontStyle: "bold",
      fontSize: templateId === "editorial" ? 9 : 10,
      font: tableFont,
    },
    bodyStyles: {
      fontSize: templateId === "ledger" ? 9 : 10,
      font: tableFont,
    },
    columnStyles,
    margin: { left: margin, right: margin },
    styles: { fontSize: 10, cellPadding: pad, font: tableFont },
  });

  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
    y + 40;
  let sumY = finalY + 10;

  if (templateId === "ledger") {
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.35);
    doc.rect(pageW - margin - 62, sumY - 4, 62, 28);
    doc.setFillColor(248, 250, 252);
    doc.rect(pageW - margin - 61.5, sumY - 3.5, 61, 27, "F");
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("BALANCE DUE", pageW - margin - 4, sumY, { align: "right" });
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(formatMoneyUSD(total), pageW - margin - 4, sumY + 10, { align: "right" });
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Sub ${formatMoneyUSD(subtotal)}`, pageW - margin - 4, sumY + 18, { align: "right" });
    doc.text(`Tax ${formatMoneyUSD(tax)}`, pageW - margin - 4, sumY + 23, { align: "right" });
    doc.setFont("helvetica", "normal");
    sumY += 34;
  } else {
    doc.setFont(templateId === "editorial" ? "times" : "helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Subtotal", pageW - margin - 50, sumY);
    doc.text(formatMoneyUSD(subtotal), pageW - margin, sumY, { align: "right" });
    sumY += 6;
    doc.text("Discount", pageW - margin - 50, sumY);
    doc.text(formatMoneyUSD(discount), pageW - margin, sumY, { align: "right" });
    sumY += 6;
    doc.text(`Tax (${snapshot.taxPercent}%)`, pageW - margin - 50, sumY);
    doc.text(formatMoneyUSD(tax), pageW - margin, sumY, { align: "right" });
    sumY += 8;
    doc.setFont(templateId === "editorial" ? "times" : "helvetica", "bold");
    if (templateId === "editorial") {
      doc.setFontSize(14);
      doc.setTextColor(41, 37, 36);
      doc.text("Total", pageW - margin - 50, sumY);
      doc.text(formatMoneyUSD(total), pageW - margin, sumY, { align: "right" });
    } else {
      doc.setTextColor(accent[0], accent[1], accent[2]);
      doc.text("Total due", pageW - margin - 50, sumY);
      doc.setTextColor(15, 23, 42);
      doc.text(formatMoneyUSD(total), pageW - margin, sumY, { align: "right" });
    }
    sumY += 12;
  }

  if (snapshot.notes.trim()) {
    doc.setFont(templateId === "editorial" ? "times" : "helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Notes", margin, sumY);
    sumY += 5;
    const noteLines = doc.splitTextToSize(snapshot.notes.trim(), pageW - margin * 2);
    doc.text(noteLines, margin, sumY);
  }

  doc.setFont(templateId === "editorial" ? "times" : "helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Thank you for your business.", pageW / 2, pageH - 12, { align: "center" });

  return doc.output("blob");
}

export function downloadInvoicePdf(blob: Blob, invoiceNumber: string) {
  const safe = invoiceNumber.replace(/[^\w.-]+/g, "_");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
