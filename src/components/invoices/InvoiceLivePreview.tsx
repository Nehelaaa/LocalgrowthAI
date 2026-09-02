"use client";

import { useEffect, useState } from "react";
import { generateInvoicePdfBlob } from "@/lib/invoice-pdf";
import type { InvoiceSnapshot } from "@/lib/invoice-types";

/** Debounce so typing doesn't rebuild the document on every keystroke. */
const REBUILD_DELAY_MS = 550;

type Props = {
  snapshot: InvoiceSnapshot;
  /** Skip work entirely while the pane is hidden (mobile, closed modal). */
  active: boolean;
  className?: string;
};

/**
 * Live preview of the actual invoice, rendered from the same PDF the Download
 * button produces — so what you see is what downloads, with no second layout
 * implementation to keep in sync.
 *
 * Note: `InvoiceDocumentPreview` is deliberately not used here. It renders
 * hardcoded sample data to show off a template's *style*, so next to the real
 * line items a user is typing it would show a different client and totals.
 */
export function InvoiceLivePreview({ snapshot, active, className = "" }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [building, setBuilding] = useState(false);
  // The pane is CSS-hidden below lg, but a hidden element still renders — without
  // this the phone would build a PDF on every keystroke that nobody can see.
  const [wideEnough, setWideEnough] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWideEnough(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!active || !wideEnough) return;

    let cancelled = false;
    setBuilding(true);

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const blob = await generateInvoicePdfBlob(snapshot);
          if (cancelled) return;
          setUrl(URL.createObjectURL(blob));
          setFailed(false);
        } catch {
          if (!cancelled) setFailed(true);
        } finally {
          if (!cancelled) setBuilding(false);
        }
      })();
    }, REBUILD_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [snapshot, active, wideEnough]);

  /**
   * Revoke a blob URL only once its replacement has rendered. React runs this
   * cleanup after the next commit, so the frame is never pointed at a URL that
   * has already been released — doing it eagerly showed a blocked-content page
   * whenever a rebuild landed (e.g. when the saved logo hydrates after open).
   */
  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <div className={`relative flex min-h-0 flex-col ${className}`}>
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Preview
        </p>
        <span className="flex items-center gap-2.5">
          <span
            className="text-xs text-slate-400 dark:text-slate-500"
            aria-live="polite"
          >
            {building ? "Updating…" : url ? "Matches your PDF" : ""}
          </span>
          {/* Escape hatch: some browsers refuse to render PDFs inline (Edge's
              "always download" setting, extensions, mobile). The frame then
              shows a blocked placeholder, so always offer a way out. */}
          {url && !failed ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Open in new tab
            </a>
          ) : null}
        </span>
      </div>

      {/* Hold the sheet to A4 so the frame ends where the page does, instead of
          leaving a band of empty viewer below it. */}
      <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto">
        <div className="aspect-[1/1.414] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {url && !failed ? (
            <iframe
              key={url}
              src={`${url}#toolbar=0&navpanes=0&view=FitH`}
              title="Invoice preview"
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {failed
                  ? "Preview unavailable — Download PDF still works."
                  : "Building preview…"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
