"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  apiClearLeadInvoiceDraft,
  apiConsumeInvoicePdfSlot,
  apiSaveLeadInvoiceDraft,
} from "@/lib/invoice-api-client";
import { FREE_INVOICE_PDF_LIMIT } from "@/lib/entitlements";
import { defaultInvoiceCompanyName } from "@/lib/invoice-branding";
import { downloadInvoicePdf, generateInvoicePdfBlob } from "@/lib/invoice-pdf";
import { formatMoneyUSD, parseMoneyFromQuote } from "@/lib/invoice-money";
import { formatInvoicePlainText } from "@/lib/invoice-plain-text";
import {
  fileToInvoiceLogoDataUrl,
  loadInvoiceSenderTemplate,
  saveInvoiceSenderTemplate,
} from "@/lib/invoice-sender-template";
import {
  getInvoiceTemplate,
  normalizeHexColor,
  normalizeInvoiceTemplateId,
} from "@/lib/invoice-templates";
import { sanitizeInvoiceDocumentTitle, sanitizeInvoiceFooterPhrase } from "@/lib/invoice-wording";
import type { InvoiceLineItem, InvoiceSnapshot } from "@/lib/invoice-types";
import { invoiceTotals } from "@/lib/invoice-types";
import {
  parseLeadInvoiceDraft,
  serializeLeadInvoiceDraftStable,
  type LeadInvoiceDraftV1,
} from "@/lib/lead-invoice-draft";

function newLineId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `li_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function nextInvoiceNumber(): string {
  return `INV-${format(new Date(), "yyyyMMdd")}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** When set, client/line items/tax/notes auto-save for this lead and reload next time. */
  leadId?: string;
  /** `Lead.invoiceDraft` from the server (parsed when the modal opens). */
  savedInvoiceDraft?: unknown;
  onInvoiceDraftSaved?: (draft: LeadInvoiceDraftV1 | null) => void;
  initialClientName: string;
  initialClientAddress: string;
  initialWebsitePriceText: string;
  /** Notes that appear on the invoice for the customer (NOT CRM lead notes). */
  initialInvoiceNotes: string;
};

/** Template/accent/density from localStorage (invoice templates page) can be newer than React state. */
function mergeLatestSavedPdfLook(snapshot: InvoiceSnapshot): InvoiceSnapshot {
  const s = loadInvoiceSenderTemplate();
  const tid = normalizeInvoiceTemplateId(s.templateId);
  const tpl = getInvoiceTemplate(tid);
  return {
    ...snapshot,
    invoiceTemplateId: tid,
    invoiceAccentHex: normalizeHexColor(s.accentHex, tpl.defaultAccentHex),
    invoiceLayoutDensity: s.density === "compact" ? "compact" : "comfortable",
    invoiceDocumentTitle: sanitizeInvoiceDocumentTitle(s.documentTitle),
    invoiceFooterPhrase: sanitizeInvoiceFooterPhrase(s.footerPhrase),
  };
}

export function InvoiceBuilderModal({
  open,
  onClose,
  leadId,
  savedInvoiceDraft,
  onInvoiceDraftSaved,
  initialClientName,
  initialClientAddress,
  initialWebsitePriceText,
  initialInvoiceNotes,
}: Props) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [senderBusinessName, setSenderBusinessName] = useState("");
  const [senderLogoDataUrl, setSenderLogoDataUrl] = useState<string | null>(null);
  const [invoiceTemplateId, setInvoiceTemplateId] = useState("minimal");
  const [invoiceAccentHex, setInvoiceAccentHex] = useState("#4f46e5");
  const [invoiceLayoutDensity, setInvoiceLayoutDensity] = useState<"compact" | "comfortable">("comfortable");
  const [logoDragOver, setLogoDragOver] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  /** True for the whole time the modal stays open (so server refetches don’t reset the form). */
  const invoiceInitDoneRef = useRef(false);
  const lastPersistedDraftRef = useRef<string>("");
  const saveDebounceRef = useRef<number | null>(null);
  const leadInvoiceDraftPayloadRef = useRef<LeadInvoiceDraftV1 | null>(null);
  /** False until the open-layout pass has applied saved draft or defaults (avoids persisting empty state). */
  const [invoiceReady, setInvoiceReady] = useState(false);
  const [draftSaveState, setDraftSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  useLayoutEffect(() => {
    if (!open) {
      invoiceInitDoneRef.current = false;
      setInvoiceReady(false);
      return;
    }
    if (invoiceInitDoneRef.current) {
      return;
    }
    invoiceInitDoneRef.current = true;

    setErr(null);
    setCopyDone(false);
    const sender = loadInvoiceSenderTemplate();
    setSenderBusinessName(sender.businessName);
    setSenderLogoDataUrl(sender.logoDataUrl);
    const tid = normalizeInvoiceTemplateId(sender.templateId);
    setInvoiceTemplateId(tid);
    setInvoiceAccentHex(
      normalizeHexColor(sender.accentHex, getInvoiceTemplate(tid).defaultAccentHex)
    );
    setInvoiceLayoutDensity(sender.density === "compact" ? "compact" : "comfortable");
    setInvoiceNumber(nextInvoiceNumber());
    setInvoiceDate(format(new Date(), "yyyy-MM-dd"));

    const parsed = parseLeadInvoiceDraft(savedInvoiceDraft);
    const defaultAmt = parseMoneyFromQuote(initialWebsitePriceText);
    const defaultLineItems: InvoiceLineItem[] = [
      { id: newLineId(), description: "Service", amount: defaultAmt },
    ];

    if (parsed) {
      setClientName(parsed.clientName);
      setClientAddress(parsed.clientAddress);
      setNotes(parsed.notes);
      setTaxPercent(Number.isFinite(parsed.taxPercent) ? parsed.taxPercent : 0);
      setDiscountAmount(
        Number.isFinite(parsed.discountAmount) ? parsed.discountAmount : 0
      );
      const rows =
        parsed.lineItems.length > 0
          ? parsed.lineItems.map((li) => ({
              id: newLineId(),
              description: li.description,
              amount: Number.isFinite(li.amount) ? li.amount : 0,
            }))
          : defaultLineItems;
      setLineItems(rows);
      lastPersistedDraftRef.current = serializeLeadInvoiceDraftStable({
        v: 1,
        clientName: parsed.clientName,
        clientAddress: parsed.clientAddress,
        lineItems: rows.map(({ description, amount }) => ({ description, amount })),
        notes: parsed.notes,
        taxPercent: Number.isFinite(parsed.taxPercent) ? parsed.taxPercent : 0,
        discountAmount: Number.isFinite(parsed.discountAmount)
          ? parsed.discountAmount
          : 0,
      });
    } else {
      setClientName(initialClientName);
      setClientAddress(initialClientAddress);
      setNotes(initialInvoiceNotes);
      setLineItems(defaultLineItems);
      setTaxPercent(0);
      setDiscountAmount(0);
      lastPersistedDraftRef.current = serializeLeadInvoiceDraftStable({
        v: 1,
        clientName: initialClientName,
        clientAddress: initialClientAddress,
        lineItems: defaultLineItems.map(({ description, amount }) => ({
          description,
          amount,
        })),
        notes: initialInvoiceNotes,
        taxPercent: 0,
        discountAmount: 0,
      });
    }
    setInvoiceReady(true);
  }, [
    open,
    savedInvoiceDraft,
    initialClientName,
    initialClientAddress,
    initialWebsitePriceText,
    initialInvoiceNotes,
  ]);

  const leadInvoiceDraftPayload = useMemo((): LeadInvoiceDraftV1 => {
    return {
      v: 1,
      clientName,
      clientAddress,
      lineItems: lineItems.map(({ description, amount }) => ({
        description,
        amount: Number.isFinite(amount) ? amount : 0,
      })),
      notes,
      taxPercent: Number.isFinite(taxPercent) ? taxPercent : 0,
      discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
    };
  }, [clientName, clientAddress, lineItems, notes, taxPercent, discountAmount]);

  leadInvoiceDraftPayloadRef.current = leadInvoiceDraftPayload;

  const persistLeadInvoiceDraft = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!leadId || !invoiceReady) return;
      const payload = leadInvoiceDraftPayloadRef.current;
      if (!payload) return;
      const next = serializeLeadInvoiceDraftStable(payload);
      if (next === lastPersistedDraftRef.current) return;
      if (!opts?.silent) setDraftSaveState("saving");
      try {
        await apiSaveLeadInvoiceDraft(leadId, payload);
        lastPersistedDraftRef.current = next;
        if (!opts?.silent) {
          setDraftSaveState("saved");
          window.setTimeout(() => {
            setDraftSaveState((state) => (state === "saved" ? "idle" : state));
          }, 2000);
        }
        onInvoiceDraftSaved?.(payload);
      } catch (e) {
        setDraftSaveState("error");
        setErr(
          e instanceof Error ? e.message : "Could not save invoice defaults."
        );
        throw e;
      }
    },
    [leadId, invoiceReady, onInvoiceDraftSaved]
  );

  const requestClose = useCallback(async () => {
    if (saveDebounceRef.current) {
      window.clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = null;
    }
    if (leadId && invoiceReady) {
      try {
        await persistLeadInvoiceDraft({ silent: true });
      } catch {
        return;
      }
    }
    onClose();
  }, [leadId, invoiceReady, persistLeadInvoiceDraft, onClose]);

  useEffect(() => {
    if (!open || !leadId || !invoiceReady) return;
    const next = serializeLeadInvoiceDraftStable(leadInvoiceDraftPayload);
    if (next === lastPersistedDraftRef.current) return;
    if (saveDebounceRef.current) {
      window.clearTimeout(saveDebounceRef.current);
    }
    saveDebounceRef.current = window.setTimeout(() => {
      saveDebounceRef.current = null;
      void persistLeadInvoiceDraft();
    }, 850);
    return () => {
      if (saveDebounceRef.current) {
        window.clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = null;
      }
    };
  }, [open, leadId, invoiceReady, leadInvoiceDraftPayload, persistLeadInvoiceDraft]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      const cur = loadInvoiceSenderTemplate();
      saveInvoiceSenderTemplate({
        ...cur,
        businessName: senderBusinessName,
        logoDataUrl: senderLogoDataUrl,
        templateId: normalizeInvoiceTemplateId(invoiceTemplateId),
        accentHex: normalizeHexColor(
          invoiceAccentHex,
          getInvoiceTemplate(invoiceTemplateId).defaultAccentHex
        ),
        density: invoiceLayoutDensity,
      });
    }, 400);
    return () => window.clearTimeout(id);
  }, [
    open,
    senderBusinessName,
    senderLogoDataUrl,
    invoiceTemplateId,
    invoiceAccentHex,
    invoiceLayoutDensity,
  ]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const syncFromStorage = () => {
      if (document.visibilityState !== "visible") return;
      const sender = loadInvoiceSenderTemplate();
      const tid = normalizeInvoiceTemplateId(sender.templateId);
      setInvoiceTemplateId(tid);
      setInvoiceAccentHex(
        normalizeHexColor(sender.accentHex, getInvoiceTemplate(tid).defaultAccentHex)
      );
      setInvoiceLayoutDensity(sender.density === "compact" ? "compact" : "comfortable");
    };
    document.addEventListener("visibilitychange", syncFromStorage);
    window.addEventListener("focus", syncFromStorage);
    return () => {
      document.removeEventListener("visibilitychange", syncFromStorage);
      window.removeEventListener("focus", syncFromStorage);
    };
  }, [open]);

  const snapshot = useMemo((): InvoiceSnapshot => {
    const senderSnap = loadInvoiceSenderTemplate();
    return {
      invoiceNumber,
      invoiceDate,
      clientName,
      clientAddress,
      lineItems,
      notes,
      taxPercent,
      discountAmount,
      senderBusinessName: senderBusinessName.trim() || undefined,
      senderLogoDataUrl: senderLogoDataUrl || null,
      invoiceTemplateId: normalizeInvoiceTemplateId(invoiceTemplateId),
      invoiceAccentHex: normalizeHexColor(
        invoiceAccentHex,
        getInvoiceTemplate(invoiceTemplateId).defaultAccentHex
      ),
      invoiceLayoutDensity,
      invoiceDocumentTitle: sanitizeInvoiceDocumentTitle(senderSnap.documentTitle),
      invoiceFooterPhrase: sanitizeInvoiceFooterPhrase(senderSnap.footerPhrase),
    };
  }, [
    invoiceNumber,
    invoiceDate,
    clientName,
    clientAddress,
    lineItems,
    notes,
    taxPercent,
    discountAmount,
    senderBusinessName,
    senderLogoDataUrl,
    invoiceTemplateId,
    invoiceAccentHex,
    invoiceLayoutDensity,
  ]);

  const applyLogoFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setErr(null);
    try {
      const dataUrl = await fileToInvoiceLogoDataUrl(file);
      setSenderLogoDataUrl(dataUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not use that image.");
    }
  }, []);

  const totals = useMemo(() => invoiceTotals(snapshot), [snapshot]);

  const updateLine = useCallback((id: string, patch: Partial<Pick<InvoiceLineItem, "description" | "amount">>) => {
    setLineItems((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }, []);

  const addLine = useCallback(() => {
    setLineItems((rows) => [...rows, { id: newLineId(), description: "", amount: 0 }]);
  }, []);

  const removeLine = useCallback((id: string) => {
    setLineItems((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.id !== id)));
  }, []);

  const handleClearSavedInvoice = useCallback(async () => {
    if (!leadId) return;
    setErr(null);
    try {
      await apiClearLeadInvoiceDraft(leadId);
      const defaultAmt = parseMoneyFromQuote(initialWebsitePriceText);
      const defaultLineItems: InvoiceLineItem[] = [
        { id: newLineId(), description: "Service", amount: defaultAmt },
      ];
      setInvoiceNumber(nextInvoiceNumber());
      setInvoiceDate(format(new Date(), "yyyy-MM-dd"));
      setClientName(initialClientName);
      setClientAddress(initialClientAddress);
      setNotes(initialInvoiceNotes);
      setLineItems(defaultLineItems);
      setTaxPercent(0);
      setDiscountAmount(0);
      lastPersistedDraftRef.current = serializeLeadInvoiceDraftStable({
        v: 1,
        clientName: initialClientName,
        clientAddress: initialClientAddress,
        lineItems: defaultLineItems.map(({ description, amount }) => ({
          description,
          amount,
        })),
        notes: initialInvoiceNotes,
        taxPercent: 0,
        discountAmount: 0,
      });
      onInvoiceDraftSaved?.(null);
      setDraftSaveState("idle");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not clear saved invoice.");
    }
  }, [
    leadId,
    initialClientName,
    initialClientAddress,
    initialWebsitePriceText,
    initialInvoiceNotes,
    onInvoiceDraftSaved,
  ]);

  const handleDownloadPdf = useCallback(async () => {
    setErr(null);
    if (!clientName.trim()) {
      setErr("Add a client name before downloading.");
      return;
    }
    const hasAmount = lineItems.some((li) => li.description.trim() && li.amount > 0);
    if (!lineItems.length || !hasAmount) {
      setErr("Add at least one line item with a description and service price.");
      return;
    }
    setPdfBusy(true);
    try {
      const quota = await apiConsumeInvoicePdfSlot();
      if (!quota.ok) {
        if (quota.code === "LIMIT") {
          setErr(
            `Free plan includes ${FREE_INVOICE_PDF_LIMIT} invoice PDFs. Upgrade to Pro on Plan & billing to generate more.`
          );
          return;
        }
        setErr("Sign in again to download invoices.");
        return;
      }
      const blob = await generateInvoicePdfBlob(mergeLatestSavedPdfLook(snapshot));
      downloadInvoicePdf(blob, snapshot.invoiceNumber);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create PDF.");
    } finally {
      setPdfBusy(false);
    }
  }, [clientName, lineItems, snapshot]);

  const handleCopyText = useCallback(async () => {
    setErr(null);
    try {
      const text = formatInvoicePlainText(mergeLatestSavedPdfLook(snapshot));
      await navigator.clipboard.writeText(text);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setErr("Clipboard not available. Select and copy manually from a downloaded PDF or notes.");
    }
  }, [snapshot]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-[1px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal
      aria-labelledby="invoice-builder-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) void requestClose();
      }}
    >
      <div
        className="flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:max-h-[min(92dvh,900px)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6 dark:border-slate-800">
          <div>
            <h2
              id="invoice-builder-title"
              className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl"
            >
              Invoice builder
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Edit details, then download a PDF or copy plain text.
            </p>
            {leadId ? (
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Client block, line items, tax, discount, and notes auto-save for this lead and
                open pre-filled next time. Invoice # and date start fresh each visit.{" "}
                {draftSaveState === "saving" ? (
                  <span className="font-medium text-slate-500 dark:text-slate-400">
                    Saving…
                  </span>
                ) : draftSaveState === "saved" ? (
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Draft saved
                  </span>
                ) : null}{" "}
                <button
                  type="button"
                  onClick={() => void handleClearSavedInvoice()}
                  className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
                >
                  Clear saved invoice
                </button>
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void requestClose()}
            className="min-h-11 min-w-11 shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close invoice builder"
          >
            <svg className="mx-auto h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6 sm:py-5">
          {err ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {err}
            </p>
          ) : null}

          <section className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-500/20 dark:bg-indigo-950/25">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Your business</h3>
              <Link
                href="/dashboard/invoice-templates"
                className="text-xs font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
              >
                Invoice templates →
              </Link>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Logo and name save here; layout and colors follow{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                {getInvoiceTemplate(normalizeInvoiceTemplateId(invoiceTemplateId)).name}
              </strong>{" "}
              from Invoice templates (PDF uses the latest saved look when you download).
            </p>
            <label className="mt-3 block text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Business name</span>
              <input
                value={senderBusinessName}
                onChange={(e) => setSenderBusinessName(e.target.value)}
                placeholder={defaultInvoiceCompanyName()}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <p className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-400">Logo</p>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="sr-only"
              onChange={(e) => {
                void applyLogoFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload logo: drag and drop an image, or press Enter to choose a file"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  logoInputRef.current?.click();
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLogoDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setLogoDragOver(false);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLogoDragOver(false);
                void applyLogoFile(e.dataTransfer.files?.[0]);
              }}
              className={
                "mt-1 flex min-h-[112px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 py-4 text-center transition-colors dark:border-slate-600 " +
                (logoDragOver
                  ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/40"
                  : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:border-indigo-500/50")
              }
              onClick={() => logoInputRef.current?.click()}
            >
              {senderLogoDataUrl ? (
                <>
                  {/* Data URL preview: next/image is not a fit here */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={senderLogoDataUrl}
                    alt=""
                    className="max-h-16 max-w-[200px] object-contain"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Drop a new image or click to replace</span>
                </>
              ) : (
                <>
                  <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008H12V8.25Z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Drag &amp; drop logo here</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG, or WebP · max 4 MB</span>
                </>
              )}
            </div>
            {senderLogoDataUrl ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSenderLogoDataUrl(null);
                }}
                className="mt-2 text-sm font-semibold text-slate-600 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Remove logo
              </button>
            ) : null}
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Invoice #</span>
              <input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Date</span>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </label>
          </div>

          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Client name</span>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Client address</span>
              <textarea
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                rows={3}
                placeholder="Street, city, state, ZIP"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </label>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Line items</h3>
              <button
                type="button"
                onClick={addLine}
                className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                + Add line
              </button>
            </div>
            <div className="space-y-2">
              {lineItems.map((li) => (
                <div
                  key={li.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-end dark:border-slate-700"
                >
                  <label className="min-w-0 flex-1 text-sm">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Service / description</span>
                    <input
                      value={li.description}
                      onChange={(e) => updateLine(li.id, { description: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </label>
                  <label className="w-full shrink-0 text-sm sm:w-32">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Service price</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={Number.isFinite(li.amount) ? li.amount : ""}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        updateLine(li.id, { amount: Number.isFinite(v) ? v : 0 });
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeLine(li.id)}
                    disabled={lineItems.length <= 1}
                    className="min-h-10 shrink-0 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Tax (%)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={taxPercent}
                onChange={(e) => setTaxPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Discount ($)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </label>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 pb-5 text-sm dark:border-slate-700 dark:bg-slate-800/50">
            <p className="mb-2 font-semibold text-slate-800 dark:text-slate-100">Summary</p>
            <div className="space-y-1.5 tabular-nums text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMoneyUSD(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>−{formatMoneyUSD(totals.discount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatMoneyUSD(totals.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900 dark:border-slate-600 dark:text-white">
                <span>Total due</span>
                <span>{formatMoneyUSD(totals.total)}</span>
              </div>
            </div>
          </div>
          <div className="h-6 shrink-0 sm:h-8" aria-hidden />
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={() => void handleCopyText()}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {copyDone ? "Copied!" : "Copy invoice text"}
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={pdfBusy}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {pdfBusy ? "Building PDF…" : "Download PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
