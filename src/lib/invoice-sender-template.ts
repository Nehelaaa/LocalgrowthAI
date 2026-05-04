import { defaultInvoiceTemplateFields, type InvoiceLayoutDensity } from "./invoice-templates";

const STORAGE_KEY = "localleadster-invoice-sender-v1";

export type InvoiceSenderTemplate = {
  businessName: string;
  logoDataUrl: string | null;
  templateId: string;
  accentHex: string;
  density: InvoiceLayoutDensity;
};

export function defaultInvoiceSenderTemplate(): InvoiceSenderTemplate {
  const d = defaultInvoiceTemplateFields();
  return {
    businessName: "",
    logoDataUrl: null,
    templateId: d.templateId,
    accentHex: d.accentHex,
    density: d.density,
  };
}

export function loadInvoiceSenderTemplate(): InvoiceSenderTemplate {
  if (typeof window === "undefined") {
    return defaultInvoiceSenderTemplate();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultInvoiceSenderTemplate();
    }
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== "object") {
      return defaultInvoiceSenderTemplate();
    }
    const o = p as Record<string, unknown>;
    const base = defaultInvoiceSenderTemplate();
    return {
      businessName: typeof o.businessName === "string" ? o.businessName : base.businessName,
      logoDataUrl: typeof o.logoDataUrl === "string" ? o.logoDataUrl : base.logoDataUrl,
      templateId: typeof o.templateId === "string" ? o.templateId : base.templateId,
      accentHex: typeof o.accentHex === "string" ? o.accentHex : base.accentHex,
      density: o.density === "compact" || o.density === "comfortable" ? o.density : base.density,
    };
  } catch {
    return defaultInvoiceSenderTemplate();
  }
}

export function saveInvoiceSenderTemplate(t: InvoiceSenderTemplate): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  } catch {
    /* quota or private mode */
  }
}

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_CANVAS_WIDTH = 480;

/**
 * Resize to a reasonable JPEG data URL for localStorage + jsPDF.
 */
export function fileToInvoiceLogoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Choose an image file (PNG, JPEG, or WebP)."));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      reject(new Error("Image is too large. Use one under 4 MB."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const scale = Math.min(1, MAX_CANVAS_WIDTH / img.naturalWidth);
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process image."));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        resolve(dataUrl);
      } catch (e) {
        reject(e instanceof Error ? e : new Error("Could not process image."));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}
