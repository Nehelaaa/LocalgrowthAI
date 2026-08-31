"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ConnectStatusResponse = {
  ok?: boolean;
  configured?: boolean;
  canUse?: boolean;
  status?: "not_pro" | "not_connected" | "pending" | "restricted" | "ready";
  chargesEnabled?: boolean;
  detailsSubmitted?: boolean;
  payoutsEnabled?: boolean;
  error?: string;
};

export function InvoicePaymentsClient({
  initialIsPro,
  connectReturn,
}: {
  initialIsPro: boolean;
  connectReturn?: string | null;
}) {
  const [data, setData] = useState<ConnectStatusResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/stripe/connect", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as ConnectStatusResponse | null;
    if (!res.ok) {
      throw new Error(json?.error || "Could not load payment status.");
    }
    setData(json);
  }, []);

  useEffect(() => {
    void refresh().catch((e) =>
      setErr(e instanceof Error ? e.message : "Could not load payment status.")
    );
  }, [refresh]);

  useEffect(() => {
    if (connectReturn === "return") {
      setFlash("Stripe onboarding returned — refreshing status…");
      void refresh()
        .then(() => setFlash("Stripe account status updated."))
        .catch(() => setFlash(null));
    } else if (connectReturn === "refresh") {
      setFlash("Onboarding link expired — start Connect again to continue.");
    }
  }, [connectReturn, refresh]);

  async function postAction(action: string) {
    setErr(null);
    setBusy(action);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
        disconnected?: boolean;
      } | null;
      if (!res.ok) {
        throw new Error(json?.error || "Request failed.");
      }
      if (json?.url) {
        window.location.href = json.url;
        return;
      }
      if (json?.disconnected) {
        setFlash("Stripe disconnected from LocalLeadster.");
        await refresh();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(null);
    }
  }

  const status = data?.status ?? (initialIsPro ? "not_connected" : "not_pro");
  const ready = status === "ready";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
          Invoice payments
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Get paid on shared invoices
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Connect your Stripe account once. When you text or share an invoice link, your
          client can pay by card — funds go to your Stripe account.
        </p>
      </header>

      {flash ? (
        <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100">
          {flash}
        </p>
      ) : null}
      {err ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {err}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Stripe connection
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {status === "not_pro" && "Pro required to collect invoice payments."}
              {status === "not_connected" && "Not connected yet."}
              {status === "pending" && "Finish Stripe onboarding to enable charges."}
              {status === "restricted" &&
                "Stripe needs more info before charges are enabled."}
              {status === "ready" && "Ready — Pay now will appear on new invoice links."}
            </p>
          </div>
          <StatusPill status={status} />
        </div>

        <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li className="flex gap-2">
            <span className="text-teal-600 dark:text-teal-400">1.</span>
            Connect Stripe Express (takes a few minutes).
          </li>
          <li className="flex gap-2">
            <span className="text-teal-600 dark:text-teal-400">2.</span>
            Share an invoice from a lead (Text link / Copy view link).
          </li>
          <li className="flex gap-2">
            <span className="text-teal-600 dark:text-teal-400">3.</span>
            Your client opens the link and taps <strong>Pay</strong>.
          </li>
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {status === "not_pro" ? (
            <Link
              href="/dashboard/plan"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:from-violet-500 hover:to-indigo-500"
            >
              Upgrade to Pro
            </Link>
          ) : (
            <>
              <button
                type="button"
                disabled={Boolean(busy) || data?.configured === false}
                onClick={() => void postAction("onboard")}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60"
              >
                {busy === "onboard"
                  ? "Opening Stripe…"
                  : ready
                    ? "Update Stripe details"
                    : status === "not_connected"
                      ? "Connect Stripe"
                      : "Continue Stripe setup"}
              </button>
              {ready ? (
                <>
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void postAction("dashboard")}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    {busy === "dashboard" ? "Opening…" : "Open Stripe payouts"}
                  </button>
                  <Link
                    href="/dashboard/leads"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-5 text-sm font-semibold text-teal-900 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100 dark:hover:bg-teal-950/60"
                  >
                    Share an invoice from a lead
                  </Link>
                </>
              ) : null}
              {data?.status && data.status !== "not_connected" ? (
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Disconnect Stripe from LocalLeadster? Existing paid invoices stay paid; new shares won’t show Pay until you reconnect."
                      )
                    ) {
                      void postAction("disconnect");
                    }
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                >
                  Disconnect
                </button>
              ) : null}
            </>
          )}
        </div>

        {ready ? (
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Tip: open a lead → create invoice → Text link / Copy view link. Pay appears when
            the share is payable.
          </p>
        ) : null}

        {data?.configured === false ? (
          <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">
            Stripe is not configured on this server yet. Contact support if this persists.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400 sm:p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white">Good to know</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Card payments require a total of at least $0.50.</li>
          <li>Payouts and refunds are managed in your Stripe Express dashboard.</li>
          <li>
            Branding on Checkout follows your Stripe account. Your LocalLeadster invoice
            branding still shows on the shared invoice page.
          </li>
          <li>
            Invoice templates & logos:{" "}
            <Link
              href="/dashboard/invoice-templates"
              className="font-medium text-slate-800 underline-offset-2 hover:underline dark:text-slate-200"
            >
              Invoice templates
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

function StatusPill({
  status,
}: {
  status: NonNullable<ConnectStatusResponse["status"]> | string;
}) {
  const map: Record<string, string> = {
    not_pro: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    not_connected: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    pending: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
    restricted: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
    ready: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100",
  };
  const label: Record<string, string> = {
    not_pro: "Pro required",
    not_connected: "Not connected",
    pending: "Setup incomplete",
    restricted: "Action needed",
    ready: "Ready",
  };
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? map.not_connected}`}
    >
      {label[status] ?? status}
    </span>
  );
}
