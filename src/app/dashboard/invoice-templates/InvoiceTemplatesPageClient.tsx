"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { InvoiceDocumentPreview } from "@/components/invoices/InvoiceDocumentPreview";
import {
  defaultInvoiceSenderTemplate,
  fileToInvoiceLogoDataUrl,
  loadInvoiceSenderTemplate,
  saveInvoiceSenderTemplate,
  type InvoiceSenderTemplate,
} from "@/lib/invoice-sender-template";
import {
  INVOICE_ACCENT_PRESETS,
  INVOICE_TEMPLATES,
  getInvoiceTemplate,
  normalizeHexColor,
  normalizeInvoiceTemplateId,
} from "@/lib/invoice-templates";

export function InvoiceTemplatesPageClient() {
  const [t, setT] = useState<InvoiceSenderTemplate>(defaultInvoiceSenderTemplate);
  const [savedFlash, setSavedFlash] = useState(false);
  const [logoErr, setLogoErr] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback((next: InvoiceSenderTemplate) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveInvoiceSenderTemplate(next);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1600);
    }, 350);
  }, []);

  const patch = useCallback(
    (p: Partial<InvoiceSenderTemplate>) => {
      setT((prev) => {
        const next: InvoiceSenderTemplate = { ...prev, ...p };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  useEffect(() => {
    // Client-only: read saved template from localStorage after mount (SSR-safe default above).
    queueMicrotask(() => {
      setT(loadInvoiceSenderTemplate());
    });
  }, []);

  const tid = normalizeInvoiceTemplateId(t.templateId);
  const tpl = getInvoiceTemplate(tid);
  const accent = normalizeHexColor(t.accentHex, tpl.defaultAccentHex);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
          Branding
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Invoice templates
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Pick a layout, set your logo and accent color, then use{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">Generate invoice</span> on any lead —
              your PDF will match this design automatically.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savedFlash && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400" role="status">
                Saved
              </span>
            )}
            <Link
              href="/dashboard/leads"
              className="text-sm font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
            >
              Back to leads →
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,24rem)]">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Choose a template</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {INVOICE_TEMPLATES.map((def) => {
              const selected = tid === def.id;
              return (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => patch({ templateId: def.id })}
                  className={
                    "group flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition dark:bg-slate-900/80 " +
                    (selected
                      ? "border-violet-500 ring-2 ring-violet-500/30 dark:border-violet-500"
                      : "border-slate-200 hover:border-violet-300/80 hover:shadow-md dark:border-slate-700 dark:hover:border-violet-500/40")
                  }
                >
                  <div className="border-b border-slate-100 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                    <InvoiceDocumentPreview
                      templateId={def.id}
                      accentHex={selected ? accent : def.defaultAccentHex}
                      businessName={t.businessName || "Your business"}
                      logoDataUrl={t.logoDataUrl}
                      density="compact"
                      compact
                    />
                  </div>
                  <div className="space-y-1 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{def.name}</span>
                      {selected && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800 dark:bg-violet-500/20 dark:text-violet-200">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{def.tagline}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Customize</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Applies to PDFs from the invoice builder.
            </p>

            <label className="mt-4 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Business name
            </label>
            <input
              type="text"
              value={t.businessName}
              onChange={(e) => patch({ businessName: e.target.value })}
              placeholder="Shown on every invoice"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />

            <p className="mt-4 text-xs font-medium text-slate-600 dark:text-slate-300">Logo</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Upload image
              </button>
              {t.logoDataUrl && (
                <button
                  type="button"
                  onClick={() => patch({ logoDataUrl: null })}
                  className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
              )}
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setLogoErr(null);
                  try {
                    const dataUrl = await fileToInvoiceLogoDataUrl(file);
                    patch({ logoDataUrl: dataUrl });
                  } catch (err) {
                    setLogoErr(err instanceof Error ? err.message : "Could not use image.");
                  }
                }}
              />
            </div>
            {logoErr && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{logoErr}</p>}

            <p className="mt-4 text-xs font-medium text-slate-600 dark:text-slate-300">Accent color</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {INVOICE_ACCENT_PRESETS.map((p) => (
                <button
                  key={p.hex}
                  type="button"
                  title={p.label}
                  onClick={() => patch({ accentHex: p.hex })}
                  className={
                    "h-8 w-8 rounded-full border-2 transition " +
                    (accent.toLowerCase() === p.hex.toLowerCase()
                      ? "border-slate-900 ring-2 ring-offset-2 ring-violet-500 dark:border-white dark:ring-offset-slate-900"
                      : "border-white/80 shadow hover:scale-105 dark:border-slate-700")
                  }
                  style={{ backgroundColor: p.hex }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <label className="sr-only" htmlFor="accent-custom">
                Custom hex color
              </label>
              <input
                id="accent-custom"
                type="color"
                value={accent}
                onChange={(e) => patch({ accentHex: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-slate-600"
              />
              <input
                type="text"
                value={accent}
                onChange={(e) => patch({ accentHex: e.target.value })}
                spellCheck={false}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <p className="mt-4 text-xs font-medium text-slate-600 dark:text-slate-300">Layout density</p>
            <div className="mt-2 flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-600">
              {(
                [
                  ["comfortable", "Comfortable"],
                  ["compact", "Compact"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => patch({ density: id })}
                  className={
                    "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition " +
                    (t.density === id
                      ? "bg-violet-600 text-white shadow-sm dark:bg-violet-500"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/80">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Live preview</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Matches your PDF layout.</p>
            <div className="mt-3 max-h-[min(70vh,32rem)] overflow-y-auto rounded-lg border border-slate-200/80 bg-slate-100/80 p-3 dark:border-slate-700 dark:bg-slate-950/50">
              <InvoiceDocumentPreview
                templateId={tid}
                accentHex={accent}
                businessName={t.businessName}
                logoDataUrl={t.logoDataUrl}
                density={t.density}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
