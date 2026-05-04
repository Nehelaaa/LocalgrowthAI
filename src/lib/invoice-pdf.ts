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
  const dateLabel = new Date(snapshot.invoiceDate).toLocaleDateString(undefined, {
    dateStyle: "long",
  });

  const pad = cellPad(snapshot);
  const logoFmt = snapshot.senderLogoDataUrl?.includes("image/png") ? "PNG" : "JPEG";

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
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageW - margin, y);
    y += 8;
  } else if (templateId === "editorial") {
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text("INVOICE", pageW / 2, y + 8, { align: "center" });
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(brand, pageW / 2, y + 16, { align: "center" });
    y += 22;
    const lb = drawLogo(pageW / 2 - 14, y, 28, 14);
    y = lb + 6;
    doc.setFontSize(9);
    doc.text(snapshot.invoiceNumber, pageW / 2, y, { align: "center" });
    doc.text(dateLabel, pageW / 2, y + 5, { align: "center" });
    y += 14;
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(0.5);
    doc.line(margin + 20, y, pageW - margin - 20, y);
    y += 8;
  } else {
    const headerTop = y;
    let logoBottom = headerTop;
    if (templateId === "minimal") {
      logoBottom = drawLogo(margin, headerTop, 32, 16);
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text(brand, margin + 36, headerTop + 10);
    } else if (templateId === "ledger") {
      logoBottom = drawLogo(margin, headerTop, 30, 15);
      doc.setFontSize(17);
      doc.setTextColor(15, 23, 42);
      doc.text(brand, margin + 34, headerTop + 9);
      doc.setDrawColor(accent[0], accent[1], accent[2]);
      doc.setLineWidth(0.6);
      doc.line(margin, headerTop + 18, margin + 70, headerTop + 18);
    } else {
      logoBottom = drawLogo(margin, headerTop, 32, 16);
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text(brand, margin + 36, headerTop + 10);
    }

    doc.setFontSize(10);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text("INVOICE", pageW - margin, headerTop + 4, { align: "right" });
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(snapshot.invoiceNumber, pageW - margin, headerTop + 10, { align: "right" });
    doc.text(dateLabel, pageW - margin, headerTop + 16, { align: "right" });

    y = Math.max(headerTop + 22, logoBottom + 6);
    if (templateId === "ledger") {
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, y, pageW - margin, y);
    } else {
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageW - margin, y);
    }
    y += 8;
  }

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

  const tableBody = snapshot.lineItems.map((li) => [
    li.description.trim() || "—",
    formatMoneyUSD(li.amount),
  ]);

  const headFill: [number, number, number] =
    templateId === "mono" ? [55, 55, 62] : [accent[0], accent[1], accent[2]];
  const tableTheme = templateId === "ledger" ? "plain" : "striped";

  autoTable(doc, {
    startY: y,
    head: [["Description", "Amount"]],
    body: tableBody,
    theme: tableTheme,
    headStyles: {
      fillColor: headFill,
      textColor: 255,
      fontStyle: "bold",
      fontSize: templateId === "editorial" ? 9 : 10,
    },
    columnStyles: {
      0: { cellWidth: pageW - margin * 2 - 36 },
      1: { halign: "right", cellWidth: 36 },
    },
    margin: { left: margin, right: margin },
    styles: { fontSize: 10, cellPadding: pad },
  });

  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
    y + 40;
  let sumY = finalY + 10;

  doc.setFont("helvetica", "normal");
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
  doc.setFont("helvetica", "bold");
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text("Total due", pageW - margin - 50, sumY);
  doc.setTextColor(15, 23, 42);
  doc.text(formatMoneyUSD(total), pageW - margin, sumY, { align: "right" });
  sumY += 12;

  if (snapshot.notes.trim()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("Notes", margin, sumY);
    sumY += 5;
    const noteLines = doc.splitTextToSize(snapshot.notes.trim(), pageW - margin * 2);
    doc.text(noteLines, margin, sumY);
  }

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
