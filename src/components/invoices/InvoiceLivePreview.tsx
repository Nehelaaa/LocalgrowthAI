"use client";

import { useEffect, useRef, useState } from "react";
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
 * Loaded on demand so pdf.js never lands in the initial dashboard bundle.
 *
 * The legacy build is deliberate: pdf.js 6's modern bundle calls very new
 * engine APIs (Map.prototype.getOrInsertComputed) that current browsers do not
 * all ship yet, and it throws mid-render on anything older. Legacy is
 * transpiled for the browsers real users are on.
 */
async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Same-origin worker URL, so it satisfies `default-src 'self'` with no CSP change.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  return pdfjs;
}

/**
 * Live preview of the actual invoice, drawn from the same PDF the Download
 * button produces — so what you see is what downloads, with no second layout
 * implementation to keep in sync.
 *
 * The page is rasterised onto a canvas with pdf.js rather than handed to an
 * <iframe>. Framing a PDF only works when the browser has a working built-in
 * PDF viewer, which is not true in Edge InPrivate, with some PDF extensions
 * installed, or on most mobile browsers — there the frame shows a blocked
 * placeholder instead of the invoice. Drawing it ourselves works everywhere.
 *
 * Note: `InvoiceDocumentPreview` is deliberately not used here. It renders
 * hardcoded sample data to show off a template's *style*, so next to the real
 * line items a user is typing it would show a different client and totals.
 */
export function InvoiceLivePreview({ snapshot, active, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const [building, setBuilding] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** pdf.js refuses to draw onto a canvas that still has a live render task. */
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

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
          const [pdfjs, blob] = await Promise.all([
            loadPdfJs(),
            generateInvoicePdfBlob(snapshot),
          ]);
          if (cancelled) return;

          const data = new Uint8Array(await blob.arrayBuffer());
          if (cancelled) return;

          // Keep the loading task: it owns the worker and is what tears it down.
          const task = pdfjs.getDocument({ data });
          const doc = await task.promise;
          const page = await doc.getPage(1);
          const canvas = canvasRef.current;
          if (cancelled || !canvas) {
            void task.destroy();
            return;
          }

          // Render at device resolution so the small type stays readable.
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const base = page.getViewport({ scale: 1 });
          const targetWidth = canvas.parentElement?.clientWidth ?? base.width;
          const viewport = page.getViewport({
            scale: (targetWidth / base.width) * dpr,
          });

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = "100%";
          canvas.style.height = "auto";

          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("no 2d context");

          // Stop any previous draw before touching the shared canvas again.
          renderTaskRef.current?.cancel();
          const renderTask = page.render({ canvas, canvasContext: ctx, viewport });
          renderTaskRef.current = renderTask;
          await renderTask.promise;
          renderTaskRef.current = null;
          void task.destroy();

          if (cancelled) return;
          setRendered(true);
          setFailed(false);
          // Kept only so the header link can open the real document.
          setDownloadUrl(URL.createObjectURL(blob));
        } catch (e) {
          // A cancelled draw is the expected outcome of a rebuild, not a failure.
          const name = (e as { name?: string } | null)?.name ?? "";
          if (!cancelled && name !== "RenderingCancelledException") {
            setFailed(true);
          }
        } finally {
          if (!cancelled) setBuilding(false);
        }
      })();
    }, REBUILD_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [snapshot, active, wideEnough]);

  /** Release a blob URL only once its replacement exists (React cleans up after commit). */
  useEffect(() => {
    if (!downloadUrl) return;
    return () => URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);

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
            {building ? "Updating…" : rendered ? "Matches your PDF" : ""}
          </span>
          {downloadUrl && !failed ? (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Open in new tab
            </a>
          ) : null}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto">
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700">
          <canvas
            ref={canvasRef}
            aria-label="Invoice preview"
            role="img"
            className={rendered ? "block" : "hidden"}
          />
          {!rendered ? (
            <div className="flex aspect-[1/1.414] items-center justify-center p-6 text-center">
              <p className="text-sm text-slate-500">
                {failed
                  ? "Preview unavailable — Download PDF still works."
                  : "Building preview…"}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
