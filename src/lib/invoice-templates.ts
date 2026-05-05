export const INVOICE_TEMPLATE_IDS = [
  "minimal",
  "ledger",
  "mono",
  "accentBar",
  "editorial",
  "horizon",
  "sidebar",
  "blueprint",
  "studio",
  "classic",
] as const;

export type InvoiceTemplateId = (typeof INVOICE_TEMPLATE_IDS)[number];

export type InvoiceLayoutDensity = "compact" | "comfortable";

/** Ruled frame + header divider for Classic template (PDF + preview). Accent color does not override this. */
export const INVOICE_CLASSIC_FRAME_HEX = "#785a3c";

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
    tagline: "Soft card, left accent stripe on the table, airy typography.",
    defaultAccentHex: "#4f46e5",
  },
  {
    id: "ledger",
    name: "Ledger",
    tagline: "Cream band, # / service / amount columns, boxed payee & balance.",
    defaultAccentHex: "#0d9488",
  },
  {
    id: "mono",
    name: "Statement",
    tagline: "Dark header bar, zebra rows, neutral table — corporate statement look.",
    defaultAccentHex: "#18181b",
  },
  {
    id: "accentBar",
    name: "Accent rail",
    tagline: "Bold rail + framed due-date card and strong invoice title.",
    defaultAccentHex: "#7c3aed",
  },
  {
    id: "editorial",
    name: "Editorial",
    tagline: "Serif headline, stone palette, two-column bill area, refined totals.",
    defaultAccentHex: "#b45309",
  },
  {
    id: "horizon",
    name: "Horizon",
    tagline: "Soft tinted header band, airy layout, calm professional feel.",
    defaultAccentHex: "#2563eb",
  },
  {
    id: "sidebar",
    name: "Sidebar",
    tagline: "Accent rail + soft panel for your brand; details read like a brief.",
    defaultAccentHex: "#059669",
  },
  {
    id: "blueprint",
    name: "Blueprint",
    tagline: "Technical sheet vibe — monospace grid, crisp borders, builder-friendly.",
    defaultAccentHex: "#0369a1",
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "Bold invoice number, underline accent, creative-studio energy.",
    defaultAccentHex: "#c026d3",
  },
  {
    id: "classic",
    name: "Classic",
    tagline: "Formal ruled frame, serif body, timeless letter-style invoice.",
    defaultAccentHex: "#92400e",
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

/** Older builds or manual localStorage may use these keys — map to current ids. */
const LEGACY_INVOICE_TEMPLATE_IDS: Record<string, InvoiceTemplateId> = {
  statement: "mono",
  accentrail: "accentBar",
  accent_rail: "accentBar",
};

export function normalizeInvoiceTemplateId(id: string | undefined | null): InvoiceTemplateId {
  if (!id) return "minimal";
  const trimmed = id.trim();
  if (isInvoiceTemplateId(trimmed)) return trimmed;
  const legacy = LEGACY_INVOICE_TEMPLATE_IDS[trimmed.toLowerCase()];
  if (legacy) return legacy;
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
