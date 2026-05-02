import { defaultInvoiceCompanyName } from "@/lib/invoice-branding";
import { formatMoneyUSD } from "@/lib/invoice-money";
import type { InvoiceSnapshot } from "@/lib/invoice-types";
import { invoiceTotals } from "@/lib/invoice-types";

export async function generateInvoicePdfBlob(snapshot: InvoiceSnapshot): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = margin;

  const brand = snapshot.senderBusinessName?.trim() || defaultInvoiceCompanyName();
  const { subtotal, discount, tax, total } = invoiceTotals(snapshot);
  const dateLabel = new Date(snapshot.invoiceDate).toLocaleDateString(undefined, {
    dateStyle: "long",
  });

  const headerTop = y;
  let logoBottom = headerTop;

  if (snapshot.senderLogoDataUrl) {
    try {
      const fmt = snapshot.senderLogoDataUrl.includes("image/png") ? "PNG" : "JPEG";
      const props = doc.getImageProperties(snapshot.senderLogoDataUrl);
      const logoMaxW = 32;
      const logoMaxH = 16;
      let imgW = logoMaxW;
      let imgH = (props.height * imgW) / props.width;
      if (imgH > logoMaxH) {
        imgH = logoMaxH;
        imgW = (props.width * imgH) / props.height;
      }
      doc.addImage(snapshot.senderLogoDataUrl, fmt, margin, headerTop, imgW, imgH);
      logoBottom = headerTop + imgH;
    } catch {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, headerTop, 28, 14, 2, 2, "F");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("LOGO", margin + 8, headerTop + 9);
      logoBottom = headerTop + 14;
    }
  } else {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, headerTop, 28, 14, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("LOGO", margin + 8, headerTop + 9);
    logoBottom = headerTop + 14;
  }

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(brand, margin + 36, headerTop + 10);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text("INVOICE", pageW - margin, headerTop + 4, { align: "right" });
  doc.setFontSize(9);
  doc.text(snapshot.invoiceNumber, pageW - margin, headerTop + 10, { align: "right" });
  doc.text(dateLabel, pageW - margin, headerTop + 16, { align: "right" });

  y = Math.max(headerTop + 22, logoBottom + 6);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

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

  autoTable(doc, {
    startY: y,
    head: [["Description", "Amount"]],
    body: tableBody,
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: pageW - margin * 2 - 36 },
      1: { halign: "right", cellWidth: 36 },
    },
    margin: { left: margin, right: margin },
    styles: { fontSize: 10, cellPadding: 3 },
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
  doc.setTextColor(15, 23, 42);
  doc.text("Total due", pageW - margin - 50, sumY);
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
  doc.text(
    "Thank you for your business.",
    pageW / 2,
    doc.internal.pageSize.getHeight() - 12,
    { align: "center" }
  );

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
