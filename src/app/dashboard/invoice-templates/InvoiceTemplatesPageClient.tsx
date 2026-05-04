"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
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

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
      />
    </svg>
  );
}

function IconLaptop({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <rect x="3" y="5" width="18" height="12" rx="1.5" />
      <path strokeLinecap="round" d="M2 18.5h20" />
    </svg>
  );
}

export function InvoiceTemplatesPageClient() {
  const [t, setT] = useState<InvoiceSenderTemplate>(defaultInvoiceSenderTemplate);
  const [previewOverlayOpen, setPreviewOverlayOpen] = useState(false);
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

  const closePreviewOverlay = useCallback(() => {
    setPreviewOverlayOpen(false);
  }, []);

  useEffect(() => {
    if (!previewOverlayOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreviewOverlay();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [previewOverlayOpen, closePreviewOverlay]);

  const tid = normalizeInvoiceTemplateId(t.templateId);
  const tpl = getInvoiceTemplate(tid);
  const accent = normalizeHexColor(t.accentHex, tpl.defaultAccentHex);

  return (
    <div className="relative mx-auto max-w-6xl space-y-8 pb-8">
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 top-40 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/10"
        aria-hidden
      />

      <header className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-violet-50/40 p-5 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20 dark:ring-white/[0.04] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            <span className="inline-flex items-center rounded-full border border-violet-200/80 bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-800 shadow-sm dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-200">
              Branding
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Invoice templates
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Pick a layout, set your logo and accent color, then use{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">Generate invoice</span> on any lead
                — your PDF will match this design automatically.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-2">
            {savedFlash && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200"
                role="status"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                Saved
              </span>
            )}
            <Link
              href="/dashboard/leads"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/80 hover:text-violet-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-violet-500/40 dark:hover:bg-violet-950/30 dark:hover:text-white"
            >
              Back to leads
              <span aria-hidden className="text-violet-500">
                →
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,24rem)]">
        <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm ring-1 ring-slate-900/[0.02] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/60 dark:ring-white/[0.03] sm:p-6">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-4 dark:border-slate-800/80">
            <span
              className="mt-0.5 hidden h-9 w-1 shrink-0 rounded-full bg-gradient-to-b from-violet-500 to-indigo-500 sm:block"
              aria-hidden
            />
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Choose a template</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Active uses your accent; hover any card for a closer look. Full fidelity is in{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">Live preview</span>.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {INVOICE_TEMPLATES.map((def) => {
              const selected = tid === def.id;
              const accentHex = selected ? accent : def.defaultAccentHex;
              return (
                <button
                  key={def.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => patch({ templateId: def.id })}
                  className={
                    "group flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-300 ease-out dark:bg-slate-900/90 " +
                    (selected
                      ? "z-[1] border-violet-500 shadow-lg shadow-violet-500/10 ring-2 ring-violet-500/25 dark:border-violet-400 dark:shadow-violet-900/20"
                      : "border-slate-200/90 hover:z-[1] hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg hover:shadow-slate-900/5 dark:border-slate-700 dark:hover:border-violet-500/50")
                  }
                >
                  <div
                    className={
                      "relative overflow-hidden border-b border-slate-100/90 bg-gradient-to-b from-slate-50 to-slate-100/50 transition-[height] duration-300 ease-out dark:border-slate-800 dark:from-slate-800/50 dark:to-slate-900/40 " +
                      (selected
                        ? "h-[9rem] sm:h-[9.75rem]"
                        : "h-[5.25rem] group-hover:h-[6rem] sm:h-[5.75rem] sm:group-hover:h-[6.5rem]")
                    }
                  >
                    <div
                      className={
                        "absolute left-1/2 top-0 w-[min(100%,26rem)] max-w-[200%] origin-top -translate-x-1/2 transition-transform duration-300 ease-out will-change-transform " +
                        (selected
                          ? "scale-[0.5] sm:scale-[0.54]"
                          : "pointer-events-none scale-[0.44] group-hover:scale-[0.52] sm:scale-[0.47] sm:group-hover:scale-[0.56]")
                      }
                    >
                      <InvoiceDocumentPreview
                        templateId={def.id}
                        accentHex={accentHex}
                        businessName={t.businessName || "Your business"}
                        logoDataUrl={t.logoDataUrl}
                        density="compact"
                        compact
                      />
                    </div>
                  </div>
                  <div className="space-y-1 bg-slate-50/40 p-3 dark:bg-slate-950/20 sm:p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={
                          selected
                            ? "text-sm font-bold tracking-tight text-slate-900 dark:text-white"
                            : "text-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-sm"
                        }
                      >
                        {def.name}
                      </span>
                      {selected ? (
                        <span className="shrink-0 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                          Active
                        </span>
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-[10px] leading-relaxed text-slate-600 dark:text-slate-400 sm:text-[11px]">
                      {def.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-md ring-1 ring-slate-900/[0.03] dark:border-slate-700 dark:from-slate-900 dark:to-slate-950/80 dark:ring-white/[0.04]">
            <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Customize</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                These choices apply to PDFs from the invoice builder on every lead.
              </p>
            </div>

            <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Business name
            </label>
            <input
              type="text"
              value={t.businessName}
              onChange={(e) => patch({ businessName: e.target.value })}
              placeholder="Shown on every invoice"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-inner shadow-slate-900/5 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Logo
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/60 hover:text-violet-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-violet-500/40 dark:hover:bg-slate-700"
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
            {logoErr && (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {logoErr}
              </p>
            )}

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Accent color
            </p>
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

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Layout density
            </p>
            <div className="mt-2 flex rounded-xl border border-slate-200 bg-slate-50/50 p-0.5 dark:border-slate-600 dark:bg-slate-800/50">
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
                    "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition " +
                    (t.density === id
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm dark:from-violet-500 dark:to-indigo-500"
                      : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-5 shadow-md ring-1 ring-slate-900/[0.03] dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/25 dark:ring-white/[0.04]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Live preview</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Mobile keeps a compact strip here. <span className="font-medium text-slate-600 dark:text-slate-300">Desktop</span>{" "}
                  opens a full overlay — no sideways scroll. PDF export is always full page.
                </p>
              </div>
              <div
                className="flex shrink-0 rounded-xl border border-slate-200/90 bg-white/80 p-0.5 shadow-sm dark:border-slate-600 dark:bg-slate-800/80"
                role="group"
                aria-label="Preview frame width"
              >
                <button
                  type="button"
                  aria-pressed={!previewOverlayOpen}
                  onClick={() => setPreviewOverlayOpen(false)}
                  className={
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition " +
                    (!previewOverlayOpen
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm dark:from-violet-500 dark:to-indigo-500"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")
                  }
                >
                  <IconPhone className="h-4 w-4" />
                  Mobile
                </button>
                <button
                  type="button"
                  aria-pressed={previewOverlayOpen}
                  onClick={() => setPreviewOverlayOpen(true)}
                  className={
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition " +
                    (previewOverlayOpen
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm dark:from-violet-500 dark:to-indigo-500"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")
                  }
                >
                  <IconLaptop className="h-4 w-4" />
                  Desktop
                </button>
              </div>
            </div>
            <div className="relative mt-4 max-h-[min(72vh,34rem)] overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200/80 bg-[radial-gradient(ellipse_at_top,_rgb(248_250_252)_0%,_rgb(241_245_249)_100%)] p-4 shadow-inner dark:border-slate-700 dark:bg-[radial-gradient(ellipse_at_top,_rgb(15_23_42)_0%,_rgb(2_6_23)_100%)]">
              <div className="mx-auto w-full max-w-[17.5rem] transition-[max-width] duration-300 ease-out">
                <InvoiceDocumentPreview
                  templateId={tid}
                  accentHex={accent}
                  businessName={t.businessName}
                  logoDataUrl={t.logoDataUrl}
                  density={t.density}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {previewOverlayOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[130] flex items-start justify-center overflow-y-auto bg-slate-900/55 p-4 pb-10 pt-10 backdrop-blur-sm sm:items-center sm:pt-14"
            role="presentation"
            onClick={closePreviewOverlay}
          >
            <div
              role="dialog"
              aria-modal
              aria-labelledby="invoice-preview-overlay-title"
              className="relative w-full max-w-[min(44rem,calc(100vw-2rem))] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl ring-1 ring-slate-900/10 dark:border-slate-600 dark:bg-slate-900 dark:ring-white/10 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h2 id="invoice-preview-overlay-title" className="text-sm font-bold text-slate-900 dark:text-white">
                    Desktop preview
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Same layout as your PDF — wider frame.</p>
                </div>
                <button
                  type="button"
                  onClick={closePreviewOverlay}
                  className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  aria-label="Close preview"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4 max-h-[min(78vh,44rem)] overflow-y-auto overflow-x-hidden rounded-xl bg-slate-50/90 p-4 dark:bg-slate-950/50">
                <div className="mx-auto w-full max-w-[40rem]">
                  <InvoiceDocumentPreview
                    templateId={tid}
                    accentHex={accent}
                    businessName={t.businessName}
                    logoDataUrl={t.logoDataUrl}
                    density={t.density}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
