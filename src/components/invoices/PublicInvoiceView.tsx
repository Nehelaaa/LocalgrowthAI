import { defaultInvoiceCompanyName } from "@/lib/invoice-branding";
import { formatMoneyUSD } from "@/lib/invoice-money";
import {
  normalizeHexColor,
  normalizeInvoiceTemplateId,
} from "@/lib/invoice-templates";
import {
  sanitizeInvoiceDocumentTitle,
  sanitizeInvoiceFooterPhrase,
} from "@/lib/invoice-wording";
import { invoiceTotals, type InvoiceSnapshot } from "@/lib/invoice-types";

function safeLogoSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(url)) return url;
  return null;
}

export function PublicInvoiceView({ snapshot }: { snapshot: InvoiceSnapshot }) {
  const totals = invoiceTotals(snapshot);
  const company =
    snapshot.senderBusinessName?.trim() || defaultInvoiceCompanyName();
  const title = sanitizeInvoiceDocumentTitle(snapshot.invoiceDocumentTitle);
  const footer = sanitizeInvoiceFooterPhrase(snapshot.invoiceFooterPhrase);
  const accent = normalizeHexColor(
    snapshot.invoiceAccentHex,
    "#0f766e"
  );
  const logo = safeLogoSrc(snapshot.senderLogoDataUrl);
  const tid = normalizeInvoiceTemplateId(snapshot.invoiceTemplateId);
  const classic = tid === "classic";

  return (
    <article
      className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      style={
        classic
          ? { borderColor: accent, borderWidth: 2 }
          : undefined
      }
    >
      <header
        className="border-b border-slate-100 px-6 py-6 sm:px-8"
        style={{ borderTop: `4px solid ${accent}` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL from share snapshot
              <img
                src={logo}
                alt=""
                className="mb-3 h-12 w-auto max-w-[180px] object-contain"
              />
            ) : null}
            <p className="text-lg font-semibold tracking-tight text-slate-900">
              {company}
            </p>
            <p
              className="mt-1 text-xs font-semibold uppercase tracking-wider"
              style={{ color: accent }}
            >
              {title}
            </p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p className="font-semibold text-slate-900">
              {snapshot.invoiceNumber}
            </p>
            <p className="mt-0.5">{snapshot.invoiceDate}</p>
          </div>
        </div>
      </header>

      <div className="px-6 py-5 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Bill to
        </p>
        <p className="mt-1 text-base font-semibold text-slate-900">
          {snapshot.clientName}
        </p>
        {snapshot.clientAddress ? (
          <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
            {snapshot.clientAddress}
          </p>
        ) : null}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-3 font-semibold">Description</th>
                <th className="pb-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.lineItems.map((li) => (
                <tr
                  key={li.id}
                  className="border-b border-slate-100 text-slate-800"
                >
                  <td className="py-2.5 pr-3 align-top">{li.description}</td>
                  <td className="py-2.5 text-right tabular-nums align-top">
                    {formatMoneyUSD(li.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatMoneyUSD(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 ? (
            <div className="flex justify-between">
              <span>Discount</span>
              <span className="tabular-nums">
                −{formatMoneyUSD(totals.discount)}
              </span>
            </div>
          ) : null}
          {totals.tax > 0 || snapshot.taxPercent > 0 ? (
            <div className="flex justify-between">
              <span>Tax ({snapshot.taxPercent}%)</span>
              <span className="tabular-nums">{formatMoneyUSD(totals.tax)}</span>
            </div>
          ) : null}
          <div
            className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900"
          >
            <span>Total due</span>
            <span className="tabular-nums" style={{ color: accent }}>
              {formatMoneyUSD(totals.total)}
            </span>
          </div>
        </div>

        {snapshot.notes ? (
          <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Notes
            </p>
            <p className="mt-1 whitespace-pre-wrap">{snapshot.notes}</p>
          </div>
        ) : null}

        <p className="mt-8 text-center text-xs text-slate-400">{footer}</p>
      </div>
    </article>
  );
}
