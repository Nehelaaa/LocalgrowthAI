"use client";

import { useState } from "react";
import { supportMailtoHref } from "@/lib/support-inbox";

export function SupportContactForm({ accountEmail }: { accountEmail: string }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [devNotice, setDevNotice] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    setDevNotice(false);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        loggedToConsole?: boolean;
      };
      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setStatus("success");
      if (data.loggedToConsole) setDevNotice(true);
      setSubject("");
      setMessage("");
    } catch {
      setStatus("error");
      setError("Network error — check your connection and try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/50"
    >
      <div>
        <label
          htmlFor="support-account-email"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Your account email
        </label>
        <p
          id="support-account-email"
          className="mt-1 text-sm text-slate-600 dark:text-slate-400"
        >
          {accountEmail}{" "}
          <span className="text-slate-500 dark:text-slate-500">
            (we attach this to your message so we can reply)
          </span>
        </p>
      </div>

      <div>
        <label
          htmlFor="support-subject"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Subject
        </label>
        <input
          id="support-subject"
          name="subject"
          required
          minLength={3}
          maxLength={200}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          autoComplete="off"
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500/0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
          placeholder="Brief summary of your question"
        />
      </div>

      <div>
        <label
          htmlFor="support-message"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Message
        </label>
        <textarea
          id="support-message"
          name="message"
          required
          minLength={10}
          maxLength={8000}
          rows={8}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500/0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
          placeholder="Describe what you need help with — steps to reproduce, screenshots in your reply email, etc."
        />
      </div>

      {status === "error" && error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}{" "}
          <a
            className="font-medium underline"
            href="mailto:localleadster@gmail.com?subject=LocalLeadster%20support"
          >
            Email us directly
          </a>
        </p>
      )}

      {status === "success" && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-200">
          Thanks — your message was sent. We&apos;ll get back to you at{" "}
          <span className="font-medium">{accountEmail}</span>.
          {devNotice && (
            <span className="mt-1 block text-emerald-800/90 dark:text-emerald-300/90">
              (Dev: Resend isn&apos;t configured — check the server terminal for
              the logged message.)
            </span>
          )}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : "Send message"}
        </button>
        <a
          href={supportMailtoHref()}
          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Open mail app instead
        </a>
      </div>
    </form>
  );
}
