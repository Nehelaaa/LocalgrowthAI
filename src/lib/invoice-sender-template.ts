import { defaultInvoiceTemplateFields, type InvoiceLayoutDensity } from "./invoice-templates";
import {
  INVOICE_DOCUMENT_TITLE_OPTIONS,
  INVOICE_FOOTER_PHRASE_OPTIONS,
  sanitizeInvoiceDocumentTitle,
  sanitizeInvoiceFooterPhrase,
} from "./invoice-wording";

const STORAGE_KEY = "localleadster-invoice-sender-v1";

export type InvoiceSenderTemplate = {
  businessName: string;
  logoDataUrl: string | null;
  templateId: string;
  accentHex: string;
  density: InvoiceLayoutDensity;
  /** Shown in PDF header (preset or short custom via templates UI). */
  documentTitle: string;
  /** One-line closing under totals. */
  footerPhrase: string;
};

export function defaultInvoiceSenderTemplate(): InvoiceSenderTemplate {
  const d = defaultInvoiceTemplateFields();
  return {
    businessName: "",
    logoDataUrl: null,
    templateId: d.templateId,
    accentHex: d.accentHex,
    density: d.density,
    documentTitle: INVOICE_DOCUMENT_TITLE_OPTIONS[0].value,
    footerPhrase: INVOICE_FOOTER_PHRASE_OPTIONS[0].value,
  };
}

function safeLogoDataUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("data:image/")) return null;
  if (raw.length > 900_000) return null;
  if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(raw)) return null;
  return raw;
}

/** Normalize unknown JSON (localStorage or DB) into a template. */
export function parseInvoiceSenderTemplate(raw: unknown): InvoiceSenderTemplate {
  const base = defaultInvoiceSenderTemplate();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const rawTitle = typeof o.documentTitle === "string" ? o.documentTitle : base.documentTitle;
  const rawFooter = typeof o.footerPhrase === "string" ? o.footerPhrase : base.footerPhrase;
  return {
    businessName: typeof o.businessName === "string" ? o.businessName : base.businessName,
    logoDataUrl: safeLogoDataUrl(o.logoDataUrl) ?? base.logoDataUrl,
    templateId: typeof o.templateId === "string" ? o.templateId : base.templateId,
    accentHex: typeof o.accentHex === "string" ? o.accentHex : base.accentHex,
    density: o.density === "compact" || o.density === "comfortable" ? o.density : base.density,
    documentTitle: sanitizeInvoiceDocumentTitle(rawTitle),
    footerPhrase: sanitizeInvoiceFooterPhrase(rawFooter),
  };
}

export function invoiceSenderTemplateHasUserContent(t: InvoiceSenderTemplate): boolean {
  return Boolean(
    t.businessName.trim() ||
      t.logoDataUrl ||
      (t.templateId && t.templateId !== defaultInvoiceSenderTemplate().templateId) ||
      t.documentTitle !== INVOICE_DOCUMENT_TITLE_OPTIONS[0].value ||
      t.footerPhrase !== INVOICE_FOOTER_PHRASE_OPTIONS[0].value
  );
}

export function loadInvoiceSenderTemplate(): InvoiceSenderTemplate {
  if (typeof window === "undefined") {
    return defaultInvoiceSenderTemplate();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultInvoiceSenderTemplate();
    return parseInvoiceSenderTemplate(JSON.parse(raw) as unknown);
  } catch {
    return defaultInvoiceSenderTemplate();
  }
}

export type SaveInvoiceSenderResult = "ok" | "partial" | "failed";

/**
 * Persist branding locally. If the logo blows the storage quota (common on mobile),
 * still save the rest of the template without the logo.
 */
export function saveInvoiceSenderTemplate(t: InvoiceSenderTemplate): SaveInvoiceSenderResult {
  if (typeof window === "undefined") return "failed";
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
    return "ok";
  } catch {
    try {
      const withoutLogo: InvoiceSenderTemplate = { ...t, logoDataUrl: null };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutLogo));
      return "partial";
    } catch {
      return "failed";
    }
  }
}

const MAX_FILE_BYTES = 4 * 1024 * 1024;
/** Keep logos small so they sync + fit mobile localStorage caches. */
const MAX_CANVAS_WIDTH = 320;
const JPEG_QUALITY = 0.72;

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== "string" || !r.startsWith("data:")) {
        reject(new Error("Could not read file."));
        return;
      }
      if (r.includes("image/svg+xml")) {
        reject(new Error("SVG logos are not supported. Please use PNG or JPEG."));
        return;
      }
      resolve(r);
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function isProbablyImage(file: File): boolean {
  if (file.type && file.type.startsWith("image/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "webp", "gif", "pjpeg", "jfif", "heic", "heif"].includes(ext);
}

/**
 * Resize to a JPEG data URL for account sync + jsPDF.
 * Prefers createImageBitmap; falls back to FileReader + Image.
 */
export async function fileToInvoiceLogoDataUrl(file: File): Promise<string> {
  if (!isProbablyImage(file)) {
    throw new Error("Choose an image file (PNG, JPEG, WebP, or GIF).");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Image is too large. Use one under 4 MB.");
  }

  let bmpW = 0;
  let bmpH = 0;
  let drawSource: CanvasImageSource | null = null;
  let bitmap: ImageBitmap | null = null;

  if (typeof createImageBitmap === "function") {
    try {
      bitmap = await createImageBitmap(file);
      bmpW = bitmap.width;
      bmpH = bitmap.height;
      drawSource = bitmap;
    } catch {
      bitmap = null;
    }
  }

  if (!drawSource) {
    const dataUrl = await readFileAsDataURL(file);
    drawSource = await new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () =>
        rej(
          new Error(
            "Could not decode image. On iPhone, try exporting as JPEG or PNG (HEIC may not work)."
          )
        );
      img.src = dataUrl;
    });
    bmpW = drawSource.naturalWidth;
    bmpH = drawSource.naturalHeight;
  }

  if (!drawSource || bmpW < 1 || bmpH < 1) {
    throw new Error("Could not decode image.");
  }

  const scale = Math.min(1, MAX_CANVAS_WIDTH / bmpW);
  const w = Math.max(1, Math.round(bmpW * scale));
  const h = Math.max(1, Math.round(bmpH * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap?.close();
    throw new Error("Could not process image.");
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(drawSource, 0, 0, w, h);
  bitmap?.close();

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
