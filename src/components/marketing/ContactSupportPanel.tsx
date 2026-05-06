"use client";

import { useState } from "react";
import Link from "next/link";
import { SUPPORT_INBOX_EMAIL, supportMailtoHref } from "@/lib/support-inbox";

export function ContactSupportPanel() {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_INBOX_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert(`Copy this address: ${SUPPORT_INBOX_EMAIL}`);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Questions about LocalLeadster? Email us — we read every message. If the &quot;Open email
        app&quot; button does nothing, copy the address below and paste it into your mail app.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a
          href={supportMailtoHref()}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-md transition hover:from-violet-500 hover:to-indigo-500 sm:flex-initial"
        >
          Open email app
        </a>
        <button
          type="button"
          onClick={() => void copyEmail()}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:flex-initial"
        >
          {copied ? "Copied!" : "Copy email address"}
        </button>
      </div>
      <p className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-4 py-3 text-center text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
        <span className="select-all">{SUPPORT_INBOX_EMAIL}</span>
      </p>
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          Sign in
        </Link>{" "}
        and use{" "}
        <span className="font-medium text-slate-800 dark:text-slate-200">Contact support</span> in the
        sidebar for the full form (including attachments).
      </p>
    </div>
  );
}
