import type { ConsumeInvoicePdfSlotResult } from "@/lib/invoice-pdf-quota-core";
import type { LeadInvoiceDraftV1 } from "@/lib/lead-invoice-draft";
import type { InvoiceSnapshot } from "@/lib/invoice-types";

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

export async function apiCreateInvoiceShare(opts: {
  leadId?: string;
  snapshot: InvoiceSnapshot;
}): Promise<{
  token: string;
  path: string;
  url: string;
  paymentsEnabled: boolean;
  paymentStatus: string;
  amountCents: number | null;
}> {
  const res = await fetch("/api/invoices/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      leadId: opts.leadId ?? null,
      snapshot: opts.snapshot,
    }),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
  const data = (await res.json()) as {
    token?: string;
    path?: string;
    paymentsEnabled?: boolean;
    paymentStatus?: string;
    amountCents?: number | null;
  };
  if (!data.token || !data.path) {
    throw new Error("Could not create a share link.");
  }
  const url = `${window.location.origin}${data.path}`;
  return {
    token: data.token,
    path: data.path,
    url,
    paymentsEnabled: Boolean(data.paymentsEnabled),
    paymentStatus: data.paymentStatus ?? "unpayable",
    amountCents: data.amountCents ?? null,
  };
}
