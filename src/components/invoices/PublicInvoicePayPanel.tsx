"use client";

import { useState } from "react";
import { formatMoneyUSD } from "@/lib/invoice-money";

type Props = {
  token: string;
  amountCents: number;
  canPay: boolean;
  status: "unpayable" | "unpaid" | "paid" | "refunded";
  queryPaid?: boolean;
  queryCanceled?: boolean;
};

export function PublicInvoicePayPanel({
  token,
  amountCents,
  canPay,
  status,
  queryPaid,
  queryCanceled,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const amountLabel = formatMoneyUSD(amountCents / 100);

  async function startPay() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/invoices/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Could not start checkout.");
      }
      window.location.href = data.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not start checkout.");
      setBusy(false);
    }
  }

  if (status === "paid" || queryPaid) {
    return (
      <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center dark:border-emerald-800/60 dark:bg-emerald-950/40">
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
          Paid{amountCents > 0 ? ` · ${amountLabel}` : ""}
        </p>
        <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-200/80">
          Thank you — this invoice has been marked paid.
        </p>
      </div>
    );
  }

  if (status === "refunded") {
    return (
      <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center dark:border-amber-800/60 dark:bg-amber-950/40">
        <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
          Payment refunded
        </p>
        <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
          This invoice payment was refunded by the seller.
        </p>
      </div>
    );
  }

  if (!canPay) return null;

  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Pay this invoice
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Secure checkout powered by Stripe
            {queryCanceled ? " · Checkout canceled — you can try again." : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void startPay()}
          disabled={busy}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          {busy ? "Redirecting…" : `Pay ${amountLabel}`}
        </button>
      </div>
      {err ? (
        <p className="mt-3 text-center text-sm text-rose-600 dark:text-rose-400 sm:text-left">
          {err}
        </p>
      ) : null}
    </div>
  );
}
