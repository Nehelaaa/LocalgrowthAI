"use client";

import { useState } from "react";
import { readResponseJson } from "@/lib/fetch-json";

type Props = {
  className?: string;
  label?: string;
};

export function UpgradeButton({ className = "", label = "Upgrade" }: Props) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const r = await fetch("/api/stripe/checkout", {
            method: "POST",
            credentials: "same-origin",
          });
          const j = await readResponseJson<{ url?: string; error?: string }>(r);
          if (j?.url) {
            window.location.href = j.url;
            return;
          }
          if (j?.error) {
            window.alert(j.error);
            return;
          }
          const hint =
            r.status === 401
              ? "Sign in again, then try checkout."
              : "No response from the server. If you are not signed in, open the app in a normal window (not a private tab) and try again. On the server, set STRIPE_SECRET_KEY and STRIPE_PRICE_ID_PRO in the environment used for this build.";
          window.alert(hint);
        } finally {
          setLoading(false);
        }
      }}
      className={
        className +
        " touch-manipulation rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
      }
    >
      {loading ? "…" : label}
    </button>
  );
}
