import type { ConsumeInvoicePdfSlotResult } from "@/lib/invoice-pdf-quota-core";
import type { LeadInvoiceDraftV1 } from "@/lib/lead-invoice-draft";

async function readApiError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  if (data?.error) return data.error;
  if (res.status === 401) return "Sign in again to use invoices.";
  return "Request failed. Refresh the page and try again.";
}

export async function apiSaveLeadInvoiceDraft(
  leadId: string,
  draft: LeadInvoiceDraftV1
): Promise<void> {
  const res = await fetch("/api/invoices/draft", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ leadId, draft }),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
}

export async function apiClearLeadInvoiceDraft(leadId: string): Promise<void> {
  const res = await fetch(
    `/api/invoices/draft?leadId=${encodeURIComponent(leadId)}`,
    {
      method: "DELETE",
      credentials: "same-origin",
    }
  );
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
}

export async function apiConsumeInvoicePdfSlot(): Promise<ConsumeInvoicePdfSlotResult> {
  const res = await fetch("/api/invoices/pdf-quota", {
    method: "POST",
    credentials: "same-origin",
  });
  if (res.ok) {
    return { ok: true };
  }
  const data = (await res.json().catch(() => null)) as
    | { ok?: false; code?: "LIMIT" | "UNAUTHORIZED" }
    | null;
  if (data?.code === "LIMIT") {
    return { ok: false, code: "LIMIT" };
  }
  if (res.status === 401 || data?.code === "UNAUTHORIZED") {
    return { ok: false, code: "UNAUTHORIZED" };
  }
  throw new Error(await readApiError(res));
}
