"use client";

import { defaultInvoiceCompanyName } from "@/lib/invoice-branding";
import { formatMoneyUSD } from "@/lib/invoice-money";
import {
  normalizeHexColor,
  normalizeInvoiceTemplateId,
  type InvoiceLayoutDensity,
} from "@/lib/invoice-templates";

const SAMPLE_LINES = [
  { description: "Website design & build", amount: 3500 },
  { description: "Monthly hosting (1 yr)", amount: 480 },
];

type Props = {
  templateId: string;
  accentHex: string;
  businessName: string;
  logoDataUrl: string | null;
  density: InvoiceLayoutDensity;
  /** Slight scale-down for template cards */
  compact?: boolean;
};

export function InvoiceDocumentPreview({
  templateId: rawTid,
  accentHex: rawAccent,
  businessName,
  logoDataUrl,
  density,
  compact,
}: Props) {
  const tid = normalizeInvoiceTemplateId(rawTid);
  const accent = normalizeHexColor(rawAccent, "#4f46e5");
  const brand = businessName.trim() || defaultInvoiceCompanyName();
  const pad = density === "compact" ? "p-3" : "p-4";
  const scale = compact ? "scale-[0.92] origin-top" : "";

  const subtotal = SAMPLE_LINES.reduce((s, l) => s + l.amount, 0);
  const tax = 0;
  const total = subtotal + tax;

  const rail = tid === "accentBar" && (
    <div
      className="absolute bottom-0 left-0 top-0 w-1.5 rounded-l-lg"
      style={{ backgroundColor: accent }}
      aria-hidden
    />
  );

  if (tid === "mono") {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10 ${scale}`}
      >
        {rail}
        <div className="bg-zinc-900 px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URLs from user upload
              <img src={logoDataUrl} alt="" className="h-9 w-auto max-w-[5.5rem] object-contain" />
            ) : (
              <div className="flex h-9 w-14 items-center justify-center rounded bg-white/10 text-[10px] text-zinc-400">
                Logo
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold tracking-tight">{brand}</p>
            </div>
            <div className="text-right text-[10px] leading-tight text-zinc-400">
              <p className="font-medium text-zinc-200">INVOICE</p>
              <p>INV-2026-0142</p>
              <p>April 22, 2026</p>
            </div>
          </div>
        </div>
        <div className={`${pad} space-y-3 border-t border-zinc-800/20`} style={{ borderTopColor: accent }}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Bill to
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Sample Client LLC</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">123 Main St, Austin, TX</p>
          </div>
          <PreviewTable accent={accent} density={density} />
          <PreviewTotals accent={accent} subtotal={subtotal} tax={tax} total={total} />
        </div>
      </div>
    );
  }

  if (tid === "editorial") {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10 ${scale}`}
      >
        {rail}
        <div className={`${pad} text-center`}>
          <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">INVOICE</p>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">{brand}</p>
          <div className="mt-3 flex justify-center">
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoDataUrl} alt="" className="h-10 w-auto max-w-[7rem] object-contain" />
            ) : (
              <div className="flex h-10 w-24 items-center justify-center rounded-lg border border-dashed border-slate-200 text-[10px] text-slate-400 dark:border-slate-600">
                Your logo
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">INV-2026-0142 · April 22, 2026</p>
          <div
            className="mx-auto mt-3 h-0.5 w-24 rounded-full"
            style={{ backgroundColor: accent }}
            aria-hidden
          />
        </div>
        <div className={`${pad} border-t border-slate-100 pt-0 dark:border-slate-800`}>
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">Bill to</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Sample Client LLC</p>
          </div>
          <PreviewTable accent={accent} density={density} />
          <PreviewTotals accent={accent} subtotal={subtotal} tax={tax} total={total} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10 ${scale}`}
    >
      {rail}
      <div className={`${pad} ${tid === "accentBar" ? "pl-5" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoDataUrl} alt="" className="h-11 w-auto max-w-[6rem] shrink-0 object-contain" />
            ) : (
              <div className="flex h-11 w-16 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[9px] text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                Logo
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">
                {brand}
              </p>
              {tid === "ledger" && (
                <div className="mt-1 h-0.5 w-12 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: accent }}>
              Invoice
            </p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">INV-2026-0142</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Apr 22, 2026</p>
          </div>
        </div>
        <div
          className={`my-3 h-px w-full ${tid === "ledger" ? "bg-slate-300 dark:bg-slate-600" : "bg-slate-200 dark:bg-slate-700"}`}
          aria-hidden
        />
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Bill to
          </p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">Sample Client LLC</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">123 Main St, Austin, TX</p>
        </div>
        <PreviewTable accent={accent} density={density} />
        <PreviewTotals accent={accent} subtotal={subtotal} tax={tax} total={total} />
      </div>
    </div>
  );
}

function PreviewTable({
  accent,
  density,
}: {
  accent: string;
  density: InvoiceLayoutDensity;
}) {
  const cell = density === "compact" ? "px-2 py-1.5 text-[11px]" : "px-2.5 py-2 text-xs";
  return (
    <table className="w-full overflow-hidden rounded-md border border-slate-200 dark:border-slate-600">
      <thead>
        <tr style={{ backgroundColor: accent }} className="text-left text-white">
          <th className={`${cell} font-semibold`}>Description</th>
          <th className={`${cell} w-20 text-right font-semibold`}>Amount</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700 dark:bg-slate-900">
        {SAMPLE_LINES.map((row) => (
          <tr key={row.description} className="text-slate-700 dark:text-slate-300">
            <td className={cell}>{row.description}</td>
            <td className={`${cell} text-right tabular-nums`}>{formatMoneyUSD(row.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PreviewTotals({
  accent,
  subtotal,
  tax,
  total,
}: {
  accent: string;
  subtotal: number;
  tax: number;
  total: number;
}) {
  return (
    <div className="mt-3 space-y-1 text-right text-xs text-slate-600 dark:text-slate-400">
      <div className="flex justify-end gap-6">
        <span>Subtotal</span>
        <span className="w-16 tabular-nums text-slate-900 dark:text-white">{formatMoneyUSD(subtotal)}</span>
      </div>
      <div className="flex justify-end gap-6">
        <span>Tax (0%)</span>
        <span className="w-16 tabular-nums">{formatMoneyUSD(tax)}</span>
      </div>
      <div className="flex justify-end gap-6 border-t border-slate-200 pt-1.5 font-semibold dark:border-slate-600">
        <span style={{ color: accent }}>Total due</span>
        <span className="w-16 tabular-nums text-slate-900 dark:text-white">{formatMoneyUSD(total)}</span>
      </div>
    </div>
  );
}
