import { defaultInvoiceCompanyName } from "@/lib/invoice-branding";
import { formatMoneyUSD } from "@/lib/invoice-money";
import {
  getInvoiceTemplate,
  hexToRgb,
  normalizeHexColor,
  normalizeInvoiceTemplateId,
} from "@/lib/invoice-templates";
import {
  invoiceDocumentTitleForPdfStyle,
  sanitizeInvoiceFooterPhrase,
} from "@/lib/invoice-wording";
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

  const footerPhrase = sanitizeInvoiceFooterPhrase(snapshot.invoiceFooterPhrase);
  const titleUpper = invoiceDocumentTitleForPdfStyle(snapshot.invoiceDocumentTitle, "upper");
  const titleMixed = invoiceDocumentTitleForPdfStyle(snapshot.invoiceDocumentTitle, "title");
  const contentLeft = templateId === "sidebar" ? 52 : margin;

  const tintBand = (w: number): [number, number, number] => [
    Math.round(accent[0] * w + 255 * (1 - w)),
    Math.round(accent[1] * w + 255 * (1 - w)),
    Math.round(accent[2] * w + 255 * (1 - w)),
  ];

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

  if (templateId === "sidebar") {
    const sb = tintBand(0.07);
    doc.setFillColor(sb[0], sb[1], sb[2]);
    doc.rect(0, 0, 46, pageH, "F");
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(0, 0, 4.2, pageH, "F");
  }

  if (templateId === "blueprint") {
    doc.setFillColor(239, 243, 249);
    doc.rect(0, 0, pageW, pageH, "F");
  }

  if (templateId === "horizon") {
    const band = tintBand(0.19);
    doc.setFillColor(band[0], band[1], band[2]);
    doc.rect(0, 0, pageW, 35, "F");
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
    doc.text(titleUpper, pageW - margin, 10, { align: "right" });
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
    doc.text(titleMixed.toUpperCase(), pageW / 2, y + 8, { align: "center", maxWidth: pageW - margin * 2 });
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
  } else if (templateId === "horizon") {
    doc.setFont("helvetica", "normal");
    const headerTop = margin + 3;
    const logoBottom = drawLogo(margin, headerTop, 30, 14);
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(brand, margin + 34, headerTop + 9);
    doc.setFontSize(8);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(titleUpper, pageW - margin, headerTop + 5, { align: "right" });
    doc.setTextColor(71, 85, 105);
    doc.text(snapshot.invoiceNumber, pageW - margin, headerTop + 11, { align: "right" });
    doc.text(dateLabel, pageW - margin, headerTop + 17, { align: "right" });
    y = Math.max(headerTop + 24, logoBottom + 4);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageW - margin, y);
    y += 8;
  } else if (templateId === "sidebar") {
    doc.setFont("helvetica", "normal");
    const headerTop = margin + 2;
    const logoBottom = drawLogo(10, headerTop, 24, 12);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(brand, 10, Math.max(headerTop + 16, logoBottom + 2), { maxWidth: 34 });
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(titleUpper, 10, Math.max(headerTop + 28, logoBottom + 10));
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(snapshot.invoiceNumber, pageW - margin, headerTop + 7, { align: "right" });
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(dateLabel, pageW - margin, headerTop + 15, { align: "right" });
    y = margin + 32;
    doc.setDrawColor(226, 232, 240);
    doc.line(contentLeft, y, pageW - margin, y);
    y += 8;
  } else if (templateId === "blueprint") {
    doc.setFont("courier", "normal");
    const headerTop = margin;
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.35);
    doc.rect(margin, headerTop, 34, 17);
    const logoBottom = drawLogo(margin + 1, headerTop + 1, 32, 15);
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(brand, margin + 38, headerTop + 11);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(titleUpper, pageW - margin, headerTop + 6, { align: "right" });
    doc.text(snapshot.invoiceNumber, pageW - margin, headerTop + 12, { align: "right" });
    doc.text(dateLabel, pageW - margin, headerTop + 18, { align: "right" });
    y = Math.max(headerTop + 24, logoBottom + 8);
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.25);
    doc.line(margin, y, pageW - margin, y);
    y += 8;
  } else if (templateId === "studio") {
    doc.setFont("helvetica", "normal");
    const headerTop = margin;
    const logoBottom = drawLogo(margin, headerTop, 28, 14);
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(brand, margin + 32, headerTop + 10);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(titleUpper, margin + 32, headerTop + 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.setTextColor(15, 23, 42);
    doc.text(snapshot.invoiceNumber, pageW - margin, headerTop + 13, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(dateLabel, pageW - margin, headerTop + 20, { align: "right" });
    y = Math.max(headerTop + 22, logoBottom + 6);
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(0.9);
    doc.line(margin, y, pageW - margin, y);
    y += 8;
  } else if (templateId === "classic") {
    doc.setFont("times", "normal");
    const headerTop = margin;
    doc.setFontSize(17);
    doc.setTextColor(55, 48, 40);
    doc.text(titleMixed.toUpperCase(), pageW / 2, headerTop + 6, {
      align: "center",
      maxWidth: pageW - margin * 2,
    });
    doc.setFontSize(11);
    doc.setTextColor(87, 83, 78);
    doc.text(brand, pageW / 2, headerTop + 14, { align: "center" });
    const lb = drawLogo(pageW / 2 - 14, headerTop + 17, 28, 12);
    doc.setFontSize(9);
    doc.setTextColor(120, 113, 108);
    doc.text(`${snapshot.invoiceNumber} · ${dateLabel}`, pageW / 2, lb + 5, { align: "center" });
    y = lb + 12;
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(0.35);
    doc.line(margin + 18, y, pageW - margin - 18, y);
    y += 10;
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
    doc.text(titleMixed, margin + 36, headerTop + 16);
    doc.setFontSize(10);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(titleUpper, pageW - margin, headerTop + 4, { align: "right" });
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
  } else if (templateId === "editorial" || templateId === "classic") {
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 113, 108);
    doc.text("Bill to", contentLeft, y);
    y += 5;
    doc.setFontSize(11);
    doc.setTextColor(41, 37, 36);
    doc.text(snapshot.clientName, contentLeft, y);
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(87, 83, 78);
    const addrLines = doc.splitTextToSize(
      snapshot.clientAddress || "—",
      pageW - contentLeft - margin - 10,
    );
    doc.text(addrLines, contentLeft, y);
    y += addrLines.length * 5 + 8;
  } else if (templateId === "blueprint") {
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.25);
    doc.rect(contentLeft, y, pageW - contentLeft - margin, 22);
    doc.setFillColor(255, 255, 255);
    doc.rect(contentLeft + 0.3, y + 0.3, pageW - contentLeft - margin - 0.6, 21.4, "F");
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("BILL TO", contentLeft + 3, y + 6);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(snapshot.clientName, contentLeft + 3, y + 12);
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const addrOne = doc.splitTextToSize(snapshot.clientAddress || "—", pageW - contentLeft - margin - 8);
    doc.text(addrOne, contentLeft + 3, y + 17);
    doc.setFont("helvetica", "normal");
    y += 28;
  } else {
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Bill to", contentLeft, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(snapshot.clientName, contentLeft, y);
    y += 5;
    const addrLines = doc.splitTextToSize(snapshot.clientAddress || "—", pageW - contentLeft - margin - 10);
    doc.text(addrLines, contentLeft, y);
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
        : templateId === "blueprint"
          ? [30, 58, 138]
          : [accent[0], accent[1], accent[2]];

  const tableTheme =
    templateId === "ledger" || templateId === "blueprint"
      ? "grid"
      : templateId === "editorial" || templateId === "classic"
        ? "plain"
        : "striped";

  const tableFont: "helvetica" | "times" | "courier" =
    templateId === "editorial" || templateId === "classic"
      ? "times"
      : templateId === "ledger" || templateId === "blueprint"
        ? "courier"
        : "helvetica";

  const columnStyles: Record<number, { cellWidth?: number; halign?: "left" | "right" }> =
    templateId === "ledger"
        ? {
          0: { cellWidth: 12, halign: "left" },
          1: { cellWidth: pageW - contentLeft - margin - 12 - 36 },
          2: { halign: "right", cellWidth: 36 },
        }
      : {
          0: { cellWidth: pageW - contentLeft - margin - 36 },
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
      fontSize: templateId === "editorial" || templateId === "classic" ? 9 : 10,
      font: tableFont,
    },
    bodyStyles: {
      fontSize: templateId === "ledger" ? 9 : 10,
      font: tableFont,
    },
    columnStyles,
    margin: { left: contentLeft, right: margin },
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
    doc.setFont(
      templateId === "editorial" || templateId === "classic"
        ? "times"
        : templateId === "blueprint"
          ? "courier"
          : "helvetica",
      "normal",
    );
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
    doc.setFont(
      templateId === "editorial" || templateId === "classic"
        ? "times"
        : templateId === "blueprint"
          ? "courier"
          : "helvetica",
      "bold",
    );
    if (templateId === "editorial" || templateId === "classic") {
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
    doc.setFont(
      templateId === "editorial" || templateId === "classic"
        ? "times"
        : templateId === "blueprint"
          ? "courier"
          : "helvetica",
      "normal",
    );
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Notes", contentLeft, sumY);
    sumY += 5;
    const noteLines = doc.splitTextToSize(snapshot.notes.trim(), pageW - contentLeft - margin);
    doc.text(noteLines, contentLeft, sumY);
  }

  doc.setFont(
    templateId === "editorial" || templateId === "classic"
      ? "times"
      : templateId === "blueprint"
        ? "courier"
        : "helvetica",
    "normal",
  );
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(footerPhrase, pageW / 2, pageH - 12, { align: "center", maxWidth: pageW - margin * 2 });

  if (templateId === "classic") {
    doc.setDrawColor(120, 90, 60);
    doc.setLineWidth(0.3);
    doc.rect(11, 11, pageW - 22, pageH - 22, "S");
    doc.setLineWidth(0.15);
    doc.rect(11.6, 11.6, pageW - 23.2, pageH - 23.2, "S");
  }

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
