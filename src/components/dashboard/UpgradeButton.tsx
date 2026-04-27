"use client";

import { useState } from "react";

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
          const r = await fetch("/api/stripe/checkout", { method: "POST" });
          const j = (await r.json()) as { url?: string; error?: string };
          if (j.url) window.location.href = j.url;
          else {
            const msg = j.error ?? "Checkout is not available. Add Stripe keys in .env.";
            window.alert(msg);
          }
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
