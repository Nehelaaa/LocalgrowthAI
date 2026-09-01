"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { InvoiceLivePreview } from "@/components/invoices/InvoiceLivePreview";
import {
  apiClearLeadInvoiceDraft,
  apiConsumeInvoicePdfSlot,
  apiCreateInvoiceShare,
  apiSaveLeadInvoiceDraft,
} from "@/lib/invoice-api-client";
import {
  buildInvoiceSmsBody,
  buildInvoiceSmsHref,
} from "@/lib/invoice-sms";
import { FREE_INVOICE_PDF_LIMIT } from "@/lib/entitlements";
import { defaultInvoiceCompanyName } from "@/lib/invoice-branding";
import { downloadInvoicePdf, generateInvoicePdfBlob } from "@/lib/invoice-pdf";
import { formatMoneyUSD, parseMoneyFromQuote } from "@/lib/invoice-money";
import { formatInvoicePlainText } from "@/lib/invoice-plain-text";
import {
  fileToInvoiceLogoDataUrl,
  loadInvoiceSenderTemplate,
} from "@/lib/invoice-sender-template";
import {
  hydrateInvoiceSenderTemplate,
  persistInvoiceSenderTemplateEverywhere,
} from "@/lib/invoice-sender-sync";
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
  /** Prefills SMS recipient when texting an invoice link (POC phone). */
  initialClientPhone?: string;
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
  initialClientPhone = "",
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
  const [smsBusy, setSmsBusy] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [lastShareUrl, setLastShareUrl] = useState<string | null>(null);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  /** Desktop-only live preview; off by default on narrow screens. */
  const [previewOpen, setPreviewOpen] = useState(true);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const [brandingReady, setBrandingReady] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
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
    setLinkCopied(false);
    setLastShareUrl(null);
    setSmsBusy(false);
    setShareMenuOpen(false);
    setBrandingReady(false);
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
    if (!open) {
      setBrandingReady(false);
      setShareMenuOpen(false);
      return;
    }
    let cancelled = false;
    setBrandingReady(false);
    void hydrateInvoiceSenderTemplate().then((sender) => {
      if (cancelled) return;
      const tid = normalizeInvoiceTemplateId(sender.templateId);
      setSenderBusinessName(sender.businessName);
      setSenderLogoDataUrl(sender.logoDataUrl);
      setInvoiceTemplateId(tid);
      setInvoiceAccentHex(
        normalizeHexColor(sender.accentHex, getInvoiceTemplate(tid).defaultAccentHex)
      );
      setInvoiceLayoutDensity(sender.density === "compact" ? "compact" : "comfortable");
      setBrandingReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !brandingReady) return;
    const id = window.setTimeout(() => {
      const cur = loadInvoiceSenderTemplate();
      persistInvoiceSenderTemplateEverywhere({
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
    }, 500);
    return () => window.clearTimeout(id);
  }, [
    open,
    brandingReady,
    senderBusinessName,
    senderLogoDataUrl,
    invoiceTemplateId,
    invoiceAccentHex,
    invoiceLayoutDensity,
  ]);

  // Header overflow menu: same dismiss rules as the share menu.
  useEffect(() => {
    if (!headerMenuOpen) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = headerMenuRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setHeaderMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHeaderMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [headerMenuOpen]);

  useEffect(() => {
    if (!shareMenuOpen) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = shareMenuRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setShareMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShareMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [shareMenuOpen]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const syncFromStorage = () => {
      if (document.visibilityState !== "visible") return;
      void hydrateInvoiceSenderTemplate().then((sender) => {
        const tid = normalizeInvoiceTemplateId(sender.templateId);
        setSenderBusinessName(sender.businessName);
        setSenderLogoDataUrl(sender.logoDataUrl);
        setInvoiceTemplateId(tid);
        setInvoiceAccentHex(
          normalizeHexColor(sender.accentHex, getInvoiceTemplate(tid).defaultAccentHex)
        );
        setInvoiceLayoutDensity(sender.density === "compact" ? "compact" : "comfortable");
      });
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
    setShareMenuOpen(false);
    try {
      const text = formatInvoicePlainText(mergeLatestSavedPdfLook(snapshot));
      await navigator.clipboard.writeText(text);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setErr("Clipboard not available. Select and copy manually from a downloaded PDF or notes.");
    }
  }, [snapshot]);

  const handleTextInvoiceLink = useCallback(async () => {
    setErr(null);
    setShareMenuOpen(false);
    if (!clientName.trim()) {
      setErr("Add a client name before texting.");
      return;
    }
    const hasAmount = lineItems.some((li) => li.description.trim() && li.amount > 0);
    if (!lineItems.length || !hasAmount) {
      setErr("Add at least one line item with a description and service price.");
      return;
    }
    setSmsBusy(true);
    try {
      const snap = mergeLatestSavedPdfLook(snapshot);
      const share = await apiCreateInvoiceShare({
        leadId,
        snapshot: snap,
      });
      setLastShareUrl(share.url);
      const business =
        snap.senderBusinessName?.trim() || defaultInvoiceCompanyName();
      const body = buildInvoiceSmsBody({
        businessName: business,
        invoiceNumber: snap.invoiceNumber,
        viewUrl: share.url,
        paymentsEnabled: share.paymentsEnabled,
      });
      const href = buildInvoiceSmsHref(initialClientPhone, body);
      window.location.href = href;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create invoice link.");
    } finally {
      setSmsBusy(false);
    }
  }, [clientName, lineItems, snapshot, leadId, initialClientPhone]);

  const handleCopyShareLink = useCallback(async () => {
    setErr(null);
    if (!clientName.trim()) {
      setErr("Add a client name before sharing.");
      setShareMenuOpen(false);
      return;
    }
    const hasAmount = lineItems.some((li) => li.description.trim() && li.amount > 0);
    if (!lineItems.length || !hasAmount) {
      setErr("Add at least one line item with a description and service price.");
      setShareMenuOpen(false);
      return;
    }
    setSmsBusy(true);
    try {
      let url = lastShareUrl;
      if (!url) {
        const share = await apiCreateInvoiceShare({
          leadId,
          snapshot: mergeLatestSavedPdfLook(snapshot),
        });
        url = share.url;
        setLastShareUrl(url);
      }
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not copy invoice link.");
      setShareMenuOpen(false);
    } finally {
      setSmsBusy(false);
    }
  }, [clientName, lineItems, snapshot, leadId, lastShareUrl]);

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
        className={
          "relative flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:max-h-[min(92dvh,900px)] sm:rounded-2xl " +
          (previewOpen ? "max-w-3xl lg:max-w-6xl" : "max-w-3xl")
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-6 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-2.5">
            <h2
              id="invoice-builder-title"
              className="truncate text-lg font-bold text-slate-900 dark:text-white sm:text-xl"
            >
              Invoice builder
            </h2>
            {/* Status belongs somewhere stable and glanceable, not mid-sentence. */}
            {leadId && draftSaveState !== "idle" ? (
              <span
                aria-live="polite"
                className={
                  "hidden shrink-0 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold sm:inline " +
                  (draftSaveState === "saved"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")
                }
              >
                {draftSaveState === "saved" ? "Saved" : "Saving…"}
              </span>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {leadId ? (
              <div className="relative" ref={headerMenuRef}>
                <button
                  type="button"
                  onClick={() => setHeaderMenuOpen((v) => !v)}
                  aria-expanded={headerMenuOpen}
                  aria-haspopup="menu"
                  aria-label="More invoice options"
                  className="min-h-11 min-w-11 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <svg className="mx-auto h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path d="M10 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 5.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 5.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
                  </svg>
                </button>
                {headerMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+0.4rem)] z-30 w-[min(100vw-2rem,19rem)] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-600 dark:bg-slate-800"
                  >
                    <p className="px-3 py-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      Client, line items, tax and notes save to this lead automatically.
                      Invoice&nbsp;# and date start fresh each time.
                    </p>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setHeaderMenuOpen(false);
                        setConfirmClearOpen(true);
                      }}
                      className="mt-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                    >
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      Clear saved invoice
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
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
        </div>

        <div className="flex min-h-0 flex-1">
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
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span>Style</span>
              <span className="rounded-md bg-white px-1.5 py-0.5 font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600">
                {getInvoiceTemplate(normalizeInvoiceTemplateId(invoiceTemplateId)).name}
              </span>
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
                  const cur = loadInvoiceSenderTemplate();
                  persistInvoiceSenderTemplateEverywhere(
                    { ...cur, logoDataUrl: null, businessName: senderBusinessName },
                    { allowClearLogo: true }
                  );
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

        {/* Preview rides alongside the form on wide screens only: an inline PDF
            frame is unreliable on mobile browsers, and the form needs the width. */}
        {previewOpen ? (
          <aside className="hidden min-h-0 w-[22rem] shrink-0 flex-col border-l border-slate-200 bg-slate-50 p-4 lg:flex xl:w-[26rem] dark:border-slate-800 dark:bg-slate-950/40">
            <InvoiceLivePreview snapshot={snapshot} active={open && previewOpen} className="min-h-0 flex-1" />
          </aside>
        ) : null}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewOpen((v) => !v)}
              aria-pressed={previewOpen}
              className="hidden min-h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 lg:inline-flex dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              {previewOpen ? "Hide preview" : "Preview"}
            </button>
            <div className="relative min-w-0 flex-1 sm:flex-none" ref={shareMenuRef}>
              <button
                type="button"
                onClick={() => setShareMenuOpen((v) => !v)}
                disabled={smsBusy}
                aria-expanded={shareMenuOpen}
                aria-haspopup="menu"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 sm:w-auto"
              >
                {smsBusy ? "Working…" : linkCopied ? "Link copied" : copyDone ? "Text copied" : "Share"}
                <svg
                  className={`h-4 w-4 text-slate-400 transition ${shareMenuOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {shareMenuOpen ? (
                <div
                  role="menu"
                  className="absolute bottom-[calc(100%+0.5rem)] left-0 z-20 w-[min(100vw-2rem,17.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleTextInvoiceLink()}
                    className="flex w-full items-start gap-3 px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/80"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-200">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 0 1-2.555-.337L3 21l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                        Text link
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">
                        Opens Messages
                        {initialClientPhone.trim() ? " with their number" : ""}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleCopyShareLink()}
                    className="flex w-full items-start gap-3 px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/80"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                        {linkCopied ? "Link copied" : "Copy view link"}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">
                        Shareable invoice page
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleCopyText()}
                    className="flex w-full items-start gap-3 px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/80"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                        {copyDone ? "Copied" : "Copy invoice text"}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">
                        Plain text for email or notes
                      </span>
                    </span>
                  </button>
                  {/* Not a share action — labelled so it doesn't read as a fourth one. */}
                  <div className="border-t border-slate-100 bg-slate-50/80 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-900/50">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                      Get paid
                    </p>
                    <Link
                      href="/dashboard/payments"
                      className="mt-0.5 inline-block text-xs font-medium text-teal-700 hover:underline dark:text-teal-300"
                      onClick={() => setShareMenuOpen(false)}
                    >
                      Enable Pay now with Stripe →
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={pdfBusy}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 sm:flex-none"
            >
              {pdfBusy ? "Building PDF…" : "Download PDF"}
            </button>
          </div>
        </div>

        {/* Clearing throws away saved work, so it asks first. */}
        {confirmClearOpen ? (
          <div
            className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4"
            role="dialog"
            aria-modal
            aria-labelledby="confirm-clear-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmClearOpen(false);
            }}
          >
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <h3
                id="confirm-clear-title"
                className="text-base font-semibold text-slate-900 dark:text-white"
              >
                Clear saved invoice?
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                This removes the client details, line items, tax, discount and notes saved
                for this lead. It cannot be undone.
              </p>
              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(false)}
                  className="lg-btn lg-btn-secondary flex-1"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmClearOpen(false);
                    void handleClearSavedInvoice();
                  }}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500"
                >
                  Clear invoice
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
