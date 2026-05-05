"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readResponseJson } from "@/lib/fetch-json";

type Props = {
  className?: string;
  /** Primary CTA styling for the billing page hero action. */
  variant?: "outline" | "primary";
  label?: string;
};

/**
 * Opens Stripe Customer Portal (same-origin POST so session cookies are sent).
 */
export function ManageBillingButton({
  className = "",
  variant = "outline",
  label,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const outlineStyles =
    "rounded-lg border border-slate-200/80 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/80";
  const primaryStyles =
    "rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60";

  const baseLabel =
    variant === "primary"
      ? "Open Stripe billing dashboard"
      : "Manage billing";

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const r = await fetch("/api/stripe/portal", {
            method: "POST",
            credentials: "same-origin",
          });
          const j = await readResponseJson<{
            url?: string;
            error?: string;
            code?: string;
          }>(r);
          if (j?.url) window.location.href = j.url;
          else if (j?.error) {
            if (r.status === 409 && j.code === "STRIPE_CUSTOMER_STALE") {
              router.refresh();
            }
            window.alert(j.error);
          }
          else {
            window.alert(
              r.status === 401
                ? "Sign in again to manage billing."
                : "Could not open billing. Refresh the page or check Stripe configuration."
            );
          }
        } finally {
          setLoading(false);
        }
      }}
      className={
        className +
        " " +
        (variant === "primary" ? primaryStyles : outlineStyles)
      }
    >
      {loading ? "…" : (label ?? baseLabel)}
    </button>
  );
}
