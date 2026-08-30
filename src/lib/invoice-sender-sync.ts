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
/** Last known logo from account — used so auto-saves never accidentally wipe it. */
let lastKnownRemoteLogo: string | null = null;

export function isInvoiceSenderHydrated(): boolean {
  return senderHydrated;
}

/** Apply branding already loaded on the server (dashboard layout) before client fetch. */
export function applyServerInvoiceSenderTemplate(
  template: InvoiceSenderTemplate
): void {
  const local = loadInvoiceSenderTemplate();
  const merged = mergeInvoiceSenderTemplates(template, local);
  lastKnownRemoteLogo = merged.logoDataUrl;
  saveInvoiceSenderTemplate(merged);
  // If account is missing the logo but this device still has it, push once.
  if (!template.logoDataUrl && local.logoDataUrl) {
    senderHydrated = true;
    void apiPutInvoiceSenderTemplate(merged)
      .then((saved) => {
        lastKnownRemoteLogo = saved.logoDataUrl;
        saveInvoiceSenderTemplate(saved);
      })
      .catch(() => undefined);
  }
}

/** Prefer primary fields; fill missing logo/name from fallback (cross-device repair). */
export function mergeInvoiceSenderTemplates(
  primary: InvoiceSenderTemplate,
  fallback: InvoiceSenderTemplate
): InvoiceSenderTemplate {
  return {
    ...primary,
    businessName: primary.businessName.trim() || fallback.businessName,
    logoDataUrl: primary.logoDataUrl || fallback.logoDataUrl,
    templateId: primary.templateId || fallback.templateId,
    accentHex: primary.accentHex || fallback.accentHex,
    density: primary.density || fallback.density,
    documentTitle: primary.documentTitle || fallback.documentTitle,
    footerPhrase: primary.footerPhrase || fallback.footerPhrase,
  };
}

/**
 * When auto-saving, never replace a known account logo with null unless the user cleared it.
 */
export function protectInvoiceSenderLogo(
  template: InvoiceSenderTemplate,
  lastKnownLogo: string | null,
  opts?: { allowClearLogo?: boolean }
): InvoiceSenderTemplate {
  if (opts?.allowClearLogo) return template;
  if (!template.logoDataUrl && lastKnownLogo) {
    return { ...template, logoDataUrl: lastKnownLogo };
  }
  return template;
}

/** Debounced account sync (keeps mobile/desktop logos in sync). */
export function scheduleInvoiceSenderTemplateRemoteSave(
  template: InvoiceSenderTemplate,
  opts?: { allowClearLogo?: boolean }
): void {
  if (typeof window === "undefined") return;
  if (!senderHydrated) return;
  if (remoteSaveTimer) clearTimeout(remoteSaveTimer);
  remoteSaveTimer = setTimeout(() => {
    remoteSaveTimer = null;
    const next = protectInvoiceSenderLogo(template, lastKnownRemoteLogo, opts);
    void apiPutInvoiceSenderTemplate(next)
      .then((saved) => {
        lastKnownRemoteLogo = saved.logoDataUrl;
      })
      .catch(() => {
        /* offline / transient — local cache still updated */
      });
  }, 500);
}

/**
 * Save locally immediately and queue account sync (after hydrate).
 * Pass `allowClearLogo: true` when the user explicitly removes the logo.
 */
export function persistInvoiceSenderTemplateEverywhere(
  template: InvoiceSenderTemplate,
  opts?: { allowClearLogo?: boolean }
): void {
  saveInvoiceSenderTemplate(template);
  if (opts?.allowClearLogo) {
    lastKnownRemoteLogo = template.logoDataUrl;
  }
  scheduleInvoiceSenderTemplateRemoteSave(template, opts);
}

/**
 * Load branding from the account. If the account has none yet but this device
 * has a saved logo/name (desktop localStorage), upload it once so phones inherit it.
 * If the account is missing a logo but this device still has one, restore it.
 */
export async function hydrateInvoiceSenderTemplate(): Promise<InvoiceSenderTemplate> {
  if (typeof window === "undefined") {
    return loadInvoiceSenderTemplate();
  }
  if (!hydratePromise) {
    hydratePromise = (async () => {
      try {
        const remote = await apiGetInvoiceSenderTemplate();
        const local = loadInvoiceSenderTemplate();

        if (remote) {
          const merged = mergeInvoiceSenderTemplates(remote, local);
          lastKnownRemoteLogo = merged.logoDataUrl;
          // Account missing logo but this browser still has one → push it up.
          if (!remote.logoDataUrl && local.logoDataUrl) {
            try {
              const saved = await apiPutInvoiceSenderTemplate(merged);
              lastKnownRemoteLogo = saved.logoDataUrl;
              saveInvoiceSenderTemplate(saved);
              return saved;
            } catch {
              /* fall through to local merge */
            }
          }
          saveInvoiceSenderTemplate(merged);
          return merged;
        }

        if (invoiceSenderTemplateHasUserContent(local)) {
          const saved = await apiPutInvoiceSenderTemplate(local);
          lastKnownRemoteLogo = saved.logoDataUrl;
          saveInvoiceSenderTemplate(saved);
          return saved;
        }

        lastKnownRemoteLogo = local.logoDataUrl;
        return local;
      } catch {
        const local = loadInvoiceSenderTemplate();
        lastKnownRemoteLogo = local.logoDataUrl;
        return local;
      } finally {
        senderHydrated = true;
        window.setTimeout(() => {
          hydratePromise = null;
        }, 15_000);
      }
    })();
  }
  return hydratePromise;
}
