"use client";

import { defaultInvoiceCompanyName } from "@/lib/invoice-branding";
import { formatMoneyUSD } from "@/lib/invoice-money";
import {
  normalizeHexColor,
  normalizeInvoiceTemplateId,
  type InvoiceLayoutDensity,
} from "@/lib/invoice-templates";
import { sanitizeInvoiceDocumentTitle, sanitizeInvoiceFooterPhrase } from "@/lib/invoice-wording";

const SAMPLE_LINES = [
  { description: "Website design & build", amount: 3500 },
  { description: "Monthly hosting (1 yr)", amount: 480 },
];

function InvoicePreviewLogo({
  logoDataUrl,
  className,
}: {
  logoDataUrl: string | null;
  className?: string;
}) {
  if (logoDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- user data URL
      <img src={logoDataUrl} alt="" className={className} />
    );
  }
  return <div className={className}>Logo</div>;
}

function PreviewFooter({ phrase }: { phrase: string }) {
  return (
    <p className="mt-3 text-center text-[10px] leading-snug text-slate-400 dark:text-slate-500">{phrase}</p>
  );
}

type Props = {
  templateId: string;
  accentHex: string;
  businessName: string;
  logoDataUrl: string | null;
  density: InvoiceLayoutDensity;
  compact?: boolean;
  documentTitle?: string;
  footerPhrase?: string;
};

export function InvoiceDocumentPreview({
  templateId: rawTid,
  accentHex: rawAccent,
  businessName,
  logoDataUrl,
  density,
  compact,
  documentTitle: rawDocTitle,
  footerPhrase: rawFooter,
}: Props) {
  const tid = normalizeInvoiceTemplateId(rawTid);
  const accent = normalizeHexColor(rawAccent, "#4f46e5");
  const brand = businessName.trim() || defaultInvoiceCompanyName();
  const docTitle = sanitizeInvoiceDocumentTitle(rawDocTitle);
  const foot = sanitizeInvoiceFooterPhrase(rawFooter);
  const pad = density === "compact" ? "p-3" : "p-4";
  const scale = compact ? "scale-[0.92] origin-top" : "";

  const subtotal = SAMPLE_LINES.reduce((s, l) => s + l.amount, 0);
  const tax = 0;
  const total = subtotal + tax;

  if (tid === "mono") {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10 ${scale}`}
      >
        <div className="bg-zinc-900 px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <InvoicePreviewLogo
  logoDataUrl={logoDataUrl} className="h-9 w-auto max-w-[5.5rem] object-contain" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold tracking-tight">{brand}</p>
            </div>
            <div className="text-right text-[10px] leading-tight text-zinc-400">
              <p className="font-medium text-zinc-200">{docTitle.toUpperCase()}</p>
              <p>INV-2026-0142</p>
              <p>April 22, 2026</p>
            </div>
          </div>
        </div>
        <div className={`${pad} space-y-3 border-t-2 border-zinc-800`} style={{ borderTopColor: accent }}>
          <BillToBlock variant="mono" />
          <PreviewTable variant="mono" accent={accent} density={density} />
          <PreviewTotals variant="mono" accent={accent} subtotal={subtotal} tax={tax} total={total} />
          <PreviewFooter phrase={foot} />
        </div>
      </div>
    );
  }

  if (tid === "editorial") {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border border-slate-200 bg-[#fafaf9] shadow-lg ring-1 ring-stone-900/5 dark:border-stone-700 dark:bg-stone-950 dark:ring-white/10 ${scale}`}
      >
        <div className={`${pad} text-center`}>
          <p className="font-serif text-2xl font-light tracking-[0.2em] text-stone-800 dark:text-stone-100">
            {docTitle.toUpperCase()}
          </p>
          <p className="mt-2 font-serif text-sm italic text-stone-600 dark:text-stone-400">{brand}</p>
          <div className="mt-4 flex justify-center">
            <InvoicePreviewLogo
  logoDataUrl={logoDataUrl} className="flex h-12 w-28 items-center justify-center rounded border border-stone-200 bg-white object-contain text-[10px] text-stone-400 dark:border-stone-600 dark:bg-stone-900" />
          </div>
          <p className="mt-3 font-mono text-[11px] text-stone-500 dark:text-stone-400">INV-2026-0142 · APR 22, 2026</p>
          <div className="mx-auto mt-4 h-px w-32 bg-stone-300 dark:bg-stone-600" aria-hidden />
        </div>
        <div className={`${pad} border-t border-stone-200/80 pt-1 dark:border-stone-800`}>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <BillToBlock variant="editorial" />
            <div
              className="hidden rounded-lg border border-dashed border-stone-300 p-3 text-left text-[10px] text-stone-500 sm:block dark:border-stone-600 dark:text-stone-400"
              aria-hidden
            >
              Payment terms: Net 15
              <br />
              Thank you for your trust.
            </div>
          </div>
          <PreviewTable variant="editorial" accent={accent} density={density} />
          <PreviewTotals variant="editorial" accent={accent} subtotal={subtotal} tax={tax} total={total} />
          <PreviewFooter phrase={foot} />
        </div>
      </div>
    );
  }

  if (tid === "ledger") {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border-2 border-slate-300 bg-gradient-to-b from-amber-50/90 to-white shadow-md dark:border-slate-600 dark:from-amber-950/20 dark:to-slate-900 ${scale}`}
      >
        <div className={`${pad} border-b-2 border-dashed border-slate-300/80 dark:border-slate-600`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-3">
              <InvoicePreviewLogo
  logoDataUrl={logoDataUrl} className="flex h-12 w-16 items-center justify-center rounded border-2 border-slate-800 bg-white text-[9px] font-bold text-slate-500 object-contain dark:border-slate-300 dark:bg-slate-900" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Remittance advice
                </p>
                <p className="text-base font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                  {brand}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">INV-2026-0142</p>
              <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400">2026-04-22</p>
            </div>
          </div>
        </div>
        <div className={pad}>
          <BillToBlock variant="ledger" />
          <PreviewTable variant="ledger" accent={accent} density={density} />
          <PreviewTotals variant="ledger" accent={accent} subtotal={subtotal} tax={tax} total={total} />
          <PreviewFooter phrase={foot} />
        </div>
      </div>
    );
  }

  if (tid === "accentBar") {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 ${scale}`}
      >
        <div
          className="absolute bottom-0 left-0 top-0 w-2 rounded-l-lg"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <div className={`${pad} pl-6`}>
          <div className="flex flex-col gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <InvoicePreviewLogo
                logoDataUrl={logoDataUrl}
                className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 object-contain text-[9px] text-slate-400 dark:bg-slate-800"
              />
              <div className="min-w-0 flex-1 pr-1">
                <p className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-white">{brand}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {docTitle}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <div
                className="w-full max-w-[13.5rem] rounded-xl border-2 border-slate-200 bg-slate-50/90 px-3 py-2 text-right shadow-sm dark:border-slate-600 dark:bg-slate-800/50 sm:px-4"
                style={{ borderColor: accent }}
              >
                <p className="text-[10px] font-bold uppercase" style={{ color: accent }}>
                  Due on receipt
                </p>
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">INV-2026-0142</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">Apr 22, 2026</p>
              </div>
            </div>
          </div>
          <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-600" />
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
            <BillToBlock variant="accentBar" />
            <div
              className="rounded-lg bg-slate-50 px-3 py-2 text-right text-[10px] text-slate-500 dark:bg-slate-800/80 dark:text-slate-400"
              aria-hidden
            >
              Wire / ACH
              <br />
              details on PDF
            </div>
          </div>
          <PreviewTable variant="accentBar" accent={accent} density={density} />
          <PreviewTotals variant="accentBar" accent={accent} subtotal={subtotal} tax={tax} total={total} />
          <PreviewFooter phrase={foot} />
        </div>
      </div>
    );
  }

  if (tid === "horizon") {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-900/[0.04] dark:border-slate-700 dark:bg-slate-900 dark:ring-white/[0.06] ${scale}`}
      >
        <div className="px-4 py-3 sm:px-5" style={{ backgroundColor: `${accent}24` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <InvoicePreviewLogo
                logoDataUrl={logoDataUrl}
                className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-white/90 object-contain text-[9px] text-slate-400 shadow-sm dark:bg-slate-800"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900 dark:text-white">{brand}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">{docTitle}</p>
              </div>
            </div>
            <div className="shrink-0 text-right text-[10px] text-slate-600 dark:text-slate-400">
              <p className="font-semibold" style={{ color: accent }}>
                {docTitle.toUpperCase()}
              </p>
              <p className="font-medium text-slate-800 dark:text-slate-200">INV-2026-0142</p>
              <p>Apr 22, 2026</p>
            </div>
          </div>
        </div>
        <div className={pad}>
          <BillToBlock variant="minimal" />
          <PreviewTable variant="minimal" accent={accent} density={density} />
          <PreviewTotals variant="minimal" accent={accent} subtotal={subtotal} tax={tax} total={total} />
          <PreviewFooter phrase={foot} />
        </div>
      </div>
    );
  }

  if (tid === "sidebar") {
    return (
      <div
        className={`relative flex min-h-[14rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900 ${scale}`}
      >
        <div
          className="flex w-[30%] min-w-[6.5rem] flex-col border-y border-r border-slate-200/90 border-l-4 bg-slate-50/95 p-3 dark:border-slate-700 dark:bg-slate-800/40"
          style={{ borderLeftColor: accent }}
        >
          <InvoicePreviewLogo
            logoDataUrl={logoDataUrl}
            className="mx-auto mb-2 flex h-10 w-full max-w-[5rem] items-center justify-center rounded-md bg-white object-contain text-[9px] text-slate-400 dark:bg-slate-900"
          />
          <p className="text-center text-[11px] font-bold leading-tight text-slate-900 dark:text-white">{brand}</p>
          <p className="mt-2 text-center text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {docTitle.toUpperCase()}
          </p>
        </div>
        <div className={`min-w-0 flex-1 ${pad}`}>
          <div className="mb-3 flex justify-end text-right text-[10px] text-slate-600 dark:text-slate-400">
            <div>
              <p className="font-mono font-semibold text-slate-900 dark:text-white">INV-2026-0142</p>
              <p>Apr 22, 2026</p>
            </div>
          </div>
          <BillToBlock variant="accentBar" />
          <PreviewTable variant="accentBar" accent={accent} density={density} />
          <PreviewTotals variant="accentBar" accent={accent} subtotal={subtotal} tax={tax} total={total} />
          <PreviewFooter phrase={foot} />
        </div>
      </div>
    );
  }

  if (tid === "blueprint") {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border-2 border-blue-900/25 bg-[#f1f5f9] shadow-md dark:border-blue-400/20 dark:bg-slate-900 ${scale}`}
      >
        <div className={`${pad} border-b border-blue-900/15 dark:border-slate-600`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-[4.5rem] items-center justify-center rounded border-2 border-blue-900/40 bg-white dark:border-blue-400/30 dark:bg-slate-950">
                <InvoicePreviewLogo logoDataUrl={logoDataUrl} className="max-h-10 max-w-full object-contain text-[9px]" />
              </div>
              <div>
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">{brand}</p>
                <p className="font-mono text-[10px] uppercase text-blue-900/70 dark:text-blue-300/80">{docTitle}</p>
              </div>
            </div>
            <div className="text-right font-mono text-[10px] text-slate-600 dark:text-slate-400">
              <p className="font-bold text-slate-900 dark:text-white">{docTitle.toUpperCase()}</p>
              <p>INV-2026-0142</p>
              <p>2026-04-22</p>
            </div>
          </div>
        </div>
        <div className={pad}>
          <BillToBlock variant="blueprint" />
          <PreviewTable variant="blueprint" accent={accent} density={density} />
          <PreviewTotals variant="blueprint" accent={accent} subtotal={subtotal} tax={tax} total={total} />
          <PreviewFooter phrase={foot} />
        </div>
      </div>
    );
  }

  if (tid === "studio") {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 ${scale}`}
      >
        <div className={pad}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <InvoicePreviewLogo
                logoDataUrl={logoDataUrl}
                className="flex h-11 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 object-contain text-[9px] dark:bg-slate-800"
              />
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">{brand}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{docTitle}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                INV-2026-0142
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Apr 22, 2026</p>
            </div>
          </div>
          <div className="my-3 h-1 w-full rounded-full" style={{ backgroundColor: accent }} aria-hidden />
          <BillToBlock variant="accentBar" />
          <PreviewTable variant="accentBar" accent={accent} density={density} />
          <PreviewTotals variant="accentBar" accent={accent} subtotal={subtotal} tax={tax} total={total} />
          <PreviewFooter phrase={foot} />
        </div>
      </div>
    );
  }

  if (tid === "classic") {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border-2 border-amber-900/25 bg-[#fffdf8] p-1 shadow-md ring-1 ring-amber-900/10 dark:border-amber-700/40 dark:bg-stone-950 dark:ring-amber-900/20 ${scale}`}
      >
        <div className={`rounded-md border border-amber-900/20 bg-[#fffdf8] dark:border-amber-800/50 dark:bg-stone-950 ${pad}`}>
          <div className="text-center">
            <p className="font-serif text-xl font-light tracking-[0.18em] text-amber-950 dark:text-amber-100">
              {docTitle.toUpperCase()}
            </p>
            <p className="mt-2 font-serif text-sm italic text-stone-600 dark:text-stone-400">{brand}</p>
            <div className="mt-3 flex justify-center">
              <InvoicePreviewLogo
                logoDataUrl={logoDataUrl}
                className="flex h-11 w-28 items-center justify-center rounded border border-stone-200 bg-white object-contain text-[10px] text-stone-400 dark:border-stone-600 dark:bg-stone-900"
              />
            </div>
            <p className="mt-2 font-mono text-[11px] text-stone-500 dark:text-stone-400">INV-2026-0142 · APR 22, 2026</p>
            <div className="mx-auto mt-3 h-px max-w-xs bg-amber-800/30 dark:bg-amber-500/30" aria-hidden />
          </div>
          <div className="mt-4 space-y-3">
            <BillToBlock variant="editorial" />
            <PreviewTable variant="editorial" accent={accent} density={density} />
            <PreviewTotals variant="editorial" accent={accent} subtotal={subtotal} tax={tax} total={total} />
            <PreviewFooter phrase={foot} />
          </div>
        </div>
      </div>
    );
  }

  /* minimal — airy, soft card, simple table */
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/80 shadow-md ring-1 ring-slate-900/[0.04] dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/90 dark:ring-white/[0.06] ${scale}`}
    >
      <div className={pad}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <InvoicePreviewLogo
  logoDataUrl={logoDataUrl} className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg bg-white object-contain text-[9px] text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-600" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                {brand}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{docTitle}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {docTitle.toUpperCase()}
            </p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">INV-2026-0142</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Apr 22, 2026</p>
          </div>
        </div>
        <div className="my-4 h-px w-full bg-slate-200/90 dark:bg-slate-700" />
        <BillToBlock variant="minimal" />
        <PreviewTable variant="minimal" accent={accent} density={density} />
        <PreviewTotals variant="minimal" accent={accent} subtotal={subtotal} tax={tax} total={total} />
        <PreviewFooter phrase={foot} />
      </div>
    </div>
  );
}

function BillToBlock({ variant }: { variant: string }) {
  if (variant === "ledger") {
    return (
      <div className="mb-3 border border-slate-800 bg-white p-2 dark:border-slate-300 dark:bg-slate-950">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pay to</p>
        <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">Sample Client LLC</p>
        <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400">123 Main St · Austin, TX 78701</p>
      </div>
    );
  }
  if (variant === "editorial") {
    return (
      <div>
        <p className="font-serif text-xs font-medium text-stone-500 dark:text-stone-400">Bill to</p>
        <p className="font-serif text-base text-stone-900 dark:text-stone-100">Sample Client LLC</p>
        <p className="font-serif text-sm text-stone-600 dark:text-stone-400">123 Main St, Austin, TX</p>
      </div>
    );
  }
  if (variant === "accentBar") {
    return (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Bill to</p>
        <p className="text-sm font-bold text-slate-900 dark:text-white">Sample Client LLC</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">123 Main St, Austin, TX</p>
      </div>
    );
  }
  if (variant === "blueprint") {
    return (
      <div className="mb-3 border border-blue-900/35 bg-white p-2 dark:border-blue-400/25 dark:bg-slate-950">
        <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-blue-900/70 dark:text-blue-300/90">
          Bill to
        </p>
        <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">Sample Client LLC</p>
        <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400">123 Main St · Austin, TX 78701</p>
      </div>
    );
  }
  return (
    <div className="mb-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Bill to</p>
      <p className="text-sm font-medium text-slate-900 dark:text-white">Sample Client LLC</p>
      <p className="text-xs text-slate-600 dark:text-slate-400">123 Main St, Austin, TX</p>
    </div>
  );
}

function PreviewTable({
  variant,
  accent,
  density,
}: {
  variant: string;
  accent: string;
  density: InvoiceLayoutDensity;
}) {
  const cell = density === "compact" ? "px-2 py-1.5 text-[11px]" : "px-2.5 py-2 text-xs";

  if (variant === "ledger") {
    return (
      <table className="w-full border-2 border-slate-800 dark:border-slate-300">
        <thead>
          <tr className="bg-slate-900 text-left text-white dark:bg-slate-100 dark:text-slate-900">
            <th className={`${cell} w-8 font-mono font-bold`}>#</th>
            <th className={`${cell} font-mono font-bold`}>Service</th>
            <th className={`${cell} w-24 text-right font-mono font-bold`}>Amount</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-950">
          {SAMPLE_LINES.map((row, i) => (
            <tr key={row.description} className="border-t border-slate-200 font-mono dark:border-slate-700">
              <td className={`${cell} text-slate-500`}>{i + 1}</td>
              <td className={`${cell} text-slate-800 dark:text-slate-200`}>{row.description}</td>
              <td className={`${cell} text-right tabular-nums text-slate-900 dark:text-white`}>
                {formatMoneyUSD(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (variant === "editorial") {
    return (
      <table className="w-full border-collapse border-y border-stone-300 dark:border-stone-600">
        <thead>
          <tr className="text-left">
            <th
              className={`${cell} border-b border-stone-300 font-serif text-stone-600 dark:border-stone-600 dark:text-stone-400`}
            >
              Description
            </th>
            <th
              className={`${cell} border-b border-stone-300 text-right font-serif text-stone-600 dark:border-stone-600 dark:text-stone-400`}
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE_LINES.map((row) => (
            <tr key={row.description} className="font-serif text-stone-800 dark:text-stone-200">
              <td className={`${cell} border-b border-stone-100 dark:border-stone-800`}>{row.description}</td>
              <td className={`${cell} border-b border-stone-100 text-right tabular-nums dark:border-stone-800`}>
                {formatMoneyUSD(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (variant === "mono") {
    return (
      <table className="w-full overflow-hidden rounded-md border border-zinc-600 dark:border-zinc-500">
        <thead>
          <tr className="bg-zinc-700 text-left text-white dark:bg-zinc-600">
            <th className={`${cell} font-medium`}>Description</th>
            <th className={`${cell} w-20 text-right font-medium`}>Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-zinc-50 dark:divide-zinc-700 dark:bg-zinc-900/50">
          {SAMPLE_LINES.map((row, i) => (
            <tr
              key={row.description}
              className={i % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-zinc-100/80 dark:bg-zinc-800/40"}
            >
              <td className={`${cell} text-zinc-800 dark:text-zinc-200`}>{row.description}</td>
              <td className={`${cell} text-right tabular-nums text-zinc-900 dark:text-white`}>
                {formatMoneyUSD(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (variant === "blueprint") {
    return (
      <table className="w-full border-2 border-blue-900/35 font-mono text-slate-800 dark:border-blue-400/30 dark:text-slate-200">
        <thead>
          <tr className="bg-blue-900 text-left text-white dark:bg-blue-950">
            <th className={`${cell} font-bold`}>Description</th>
            <th className={`${cell} w-20 text-right font-bold`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE_LINES.map((row, i) => (
            <tr key={row.description} className={i % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-100/80 dark:bg-slate-900/60"}>
              <td className={`${cell} border-t border-blue-900/15 dark:border-slate-600`}>{row.description}</td>
              <td className={`${cell} border-t border-blue-900/15 text-right tabular-nums dark:border-slate-600`}>
                {formatMoneyUSD(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (variant === "accentBar") {
    return (
      <table className="w-full overflow-hidden rounded-lg shadow-inner ring-1 ring-slate-200 dark:ring-slate-600">
        <thead>
          <tr className="text-left text-white" style={{ backgroundColor: accent }}>
            <th className={`${cell} font-bold tracking-wide`}>Description</th>
            <th className={`${cell} w-20 text-right font-bold`}>Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700 dark:bg-slate-900">
          {SAMPLE_LINES.map((row) => (
            <tr key={row.description} className="text-slate-700 dark:text-slate-300">
              <td className={cell}>{row.description}</td>
              <td className={`${cell} text-right tabular-nums font-semibold`}>{formatMoneyUSD(row.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  /* minimal */
  return (
    <table className="w-full overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900">
      <thead>
        <tr
          className="border-l-4 border-slate-100 bg-slate-50 text-left dark:border-slate-700 dark:bg-slate-800/50"
          style={{ borderLeftColor: accent }}
        >
          <th className={`${cell} font-semibold text-slate-800 dark:text-slate-200`}>Description</th>
          <th className={`${cell} w-20 text-right font-semibold text-slate-800 dark:text-slate-200`}>Amount</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
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
  variant,
  accent,
  subtotal,
  tax,
  total,
}: {
  variant: string;
  accent: string;
  subtotal: number;
  tax: number;
  total: number;
}) {
  if (variant === "blueprint") {
    return (
      <div className="mt-3 space-y-1 border border-blue-900/30 bg-white p-2 text-right font-mono text-[11px] dark:border-blue-400/25 dark:bg-slate-950">
        <div className="flex justify-end gap-6 text-slate-600 dark:text-slate-400">
          <span>Subtotal</span>
          <span className="w-16 tabular-nums text-slate-900 dark:text-white">{formatMoneyUSD(subtotal)}</span>
        </div>
        <div className="flex justify-end gap-6 text-slate-600 dark:text-slate-400">
          <span>Tax (0%)</span>
          <span className="w-16 tabular-nums">{formatMoneyUSD(tax)}</span>
        </div>
        <div className="flex justify-end gap-6 border-t border-blue-900/25 pt-1.5 font-bold text-slate-900 dark:border-slate-600 dark:text-white">
          <span style={{ color: accent }}>Total due</span>
          <span className="w-16 tabular-nums">{formatMoneyUSD(total)}</span>
        </div>
      </div>
    );
  }

  if (variant === "ledger") {
    return (
      <div className="mt-3 border-2 border-slate-900 bg-slate-50 p-3 dark:border-slate-200 dark:bg-slate-900">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Balance due
            </p>
            <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {formatMoneyUSD(total)}
            </p>
          </div>
          <div className="space-y-0.5 text-right font-mono text-[10px] text-slate-600 dark:text-slate-400">
            <div>
              Subtotal <span className="tabular-nums">{formatMoneyUSD(subtotal)}</span>
            </div>
            <div>
              Tax <span className="tabular-nums">{formatMoneyUSD(tax)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "editorial") {
    return (
      <div className="mt-4 flex justify-end border-t border-stone-200 pt-3 dark:border-stone-700">
        <div className="text-right font-serif">
          <p className="text-xs text-stone-500 dark:text-stone-400">Total</p>
          <p className="text-2xl font-light tabular-nums text-stone-900 dark:text-stone-100">
            {formatMoneyUSD(total)}
          </p>
        </div>
      </div>
    );
  }

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
      <div
        className={`flex justify-end gap-6 border-t pt-1.5 font-semibold dark:border-slate-600 ${
          variant === "minimal" ? "border-slate-200" : "border-slate-200"
        }`}
      >
        <span style={{ color: accent }}>Total due</span>
        <span className="w-16 tabular-nums text-slate-900 dark:text-white">{formatMoneyUSD(total)}</span>
      </div>
    </div>
  );
}
