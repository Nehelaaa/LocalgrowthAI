import type { InvoiceSenderTemplate } from "@/lib/invoice-sender-template";
import {
  invoiceSenderTemplateHasUserContent,
  loadInvoiceSenderTemplate,
  parseInvoiceSenderTemplate,
  saveInvoiceSenderTemplate,
} from "@/lib/invoice-sender-template";

async function readApiError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  if (data?.error) return data.error;
  if (res.status === 401) return "Sign in again to save invoice branding.";
  return "Could not sync invoice branding.";
}

export async function apiGetInvoiceSenderTemplate(): Promise<InvoiceSenderTemplate | null> {
  const res = await fetch("/api/invoices/sender-template", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
  const data = (await res.json()) as { template?: unknown };
  if (data.template == null) return null;
  return parseInvoiceSenderTemplate(data.template);
}

export async function apiPutInvoiceSenderTemplate(
  template: InvoiceSenderTemplate
): Promise<InvoiceSenderTemplate> {
  const res = await fetch("/api/invoices/sender-template", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ template }),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
  const data = (await res.json()) as { template?: unknown };
  return parseInvoiceSenderTemplate(data.template ?? template);
}

let remoteSaveTimer: ReturnType<typeof setTimeout> | null = null;
let hydratePromise: Promise<InvoiceSenderTemplate> | null = null;
/** Prevents writing empty local state to the account before the first sync finishes. */
let senderHydrated = false;

export function isInvoiceSenderHydrated(): boolean {
  return senderHydrated;
}

/** Debounced account sync (keeps mobile/desktop logos in sync). */
export function scheduleInvoiceSenderTemplateRemoteSave(
  template: InvoiceSenderTemplate
): void {
  if (typeof window === "undefined") return;
  if (!senderHydrated) return;
  if (remoteSaveTimer) clearTimeout(remoteSaveTimer);
  remoteSaveTimer = setTimeout(() => {
    remoteSaveTimer = null;
    void apiPutInvoiceSenderTemplate(template).catch(() => {
      /* offline / transient — local cache still updated */
    });
  }, 500);
}

/** Save locally immediately and queue account sync (after hydrate). */
export function persistInvoiceSenderTemplateEverywhere(
  template: InvoiceSenderTemplate
): void {
  saveInvoiceSenderTemplate(template);
  scheduleInvoiceSenderTemplateRemoteSave(template);
}

/**
 * Load branding from the account. If the account has none yet but this device
 * has a saved logo/name (desktop localStorage), upload it once so phones inherit it.
 */
export async function hydrateInvoiceSenderTemplate(): Promise<InvoiceSenderTemplate> {
  if (typeof window === "undefined") {
    return loadInvoiceSenderTemplate();
  }
  if (!hydratePromise) {
    hydratePromise = (async () => {
      try {
        const remote = await apiGetInvoiceSenderTemplate();
        if (remote) {
          saveInvoiceSenderTemplate(remote);
          return remote;
        }
        const local = loadInvoiceSenderTemplate();
        if (invoiceSenderTemplateHasUserContent(local)) {
          const saved = await apiPutInvoiceSenderTemplate(local);
          saveInvoiceSenderTemplate(saved);
          return saved;
        }
        return local;
      } catch {
        return loadInvoiceSenderTemplate();
      } finally {
        senderHydrated = true;
        window.setTimeout(() => {
          hydratePromise = null;
        }, 30_000);
      }
    })();
  }
  return hydratePromise;
}
