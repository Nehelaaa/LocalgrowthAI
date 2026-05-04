export const INVOICE_TEMPLATE_IDS = [
  "minimal",
  "ledger",
  "mono",
  "accentBar",
  "editorial",
] as const;

export type InvoiceTemplateId = (typeof INVOICE_TEMPLATE_IDS)[number];

export type InvoiceLayoutDensity = "compact" | "comfortable";

export type InvoiceTemplateDefinition = {
  id: InvoiceTemplateId;
  name: string;
  tagline: string;
  /** Default accent when user hasn’t picked one */
  defaultAccentHex: string;
};

export const INVOICE_TEMPLATES: InvoiceTemplateDefinition[] = [
  {
    id: "minimal",
    name: "Minimal",
    tagline: "Clean layout with a soft divider and balanced typography.",
    defaultAccentHex: "#4f46e5",
  },
  {
    id: "ledger",
    name: "Ledger",
    tagline: "Accounting-inspired lines and a confident totals block.",
    defaultAccentHex: "#0d9488",
  },
  {
    id: "mono",
    name: "Statement",
    tagline: "Bold top bar — reads like a premium financial statement.",
    defaultAccentHex: "#18181b",
  },
  {
    id: "accentBar",
    name: "Accent rail",
    tagline: "Vertical color rail for instant brand recognition.",
    defaultAccentHex: "#7c3aed",
  },
  {
    id: "editorial",
    name: "Editorial",
    tagline: "Large invoice title with centered hierarchy.",
    defaultAccentHex: "#b45309",
  },
];

export function defaultInvoiceTemplateFields(): {
  templateId: InvoiceTemplateId;
  accentHex: string;
  density: InvoiceLayoutDensity;
} {
  const t = INVOICE_TEMPLATES[0];
  return {
    templateId: t.id,
    accentHex: t.defaultAccentHex,
    density: "comfortable",
  };
}

export function getInvoiceTemplate(id: string | undefined | null): InvoiceTemplateDefinition {
  const found = INVOICE_TEMPLATES.find((t) => t.id === id);
  return found ?? INVOICE_TEMPLATES[0];
}

export function isInvoiceTemplateId(id: string): id is InvoiceTemplateId {
  return (INVOICE_TEMPLATE_IDS as readonly string[]).includes(id);
}

export function normalizeInvoiceTemplateId(id: string | undefined | null): InvoiceTemplateId {
  if (id && isInvoiceTemplateId(id)) return id;
  return "minimal";
}

/** Preset swatches for quick accent selection (hex). */
export const INVOICE_ACCENT_PRESETS = [
  { label: "Indigo", hex: "#4f46e5" },
  { label: "Violet", hex: "#7c3aed" },
  { label: "Teal", hex: "#0d9488" },
  { label: "Rose", hex: "#e11d48" },
  { label: "Amber", hex: "#d97706" },
  { label: "Slate", hex: "#475569" },
] as const;

export function normalizeHexColor(raw: string | undefined | null, fallback: string): string {
  const t = (raw ?? "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toLowerCase();
  return fallback;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = normalizeHexColor(hex, "#4f46e5");
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return [r, g, b];
}
