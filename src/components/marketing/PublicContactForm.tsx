"use client";

import { useCallback, useRef, useState } from "react";
import { BOT_HONEYPOT_FIELD } from "@/lib/form-bot-guard";
import {
  SUPPORT_MAX_ATTACHMENTS,
  SUPPORT_MAX_SINGLE_FILE_BYTES,
  SUPPORT_MAX_TOTAL_ATTACHMENT_BYTES,
  isAllowedSupportFile,
  supportAttachmentMimeLabel,
} from "@/lib/support-attachments";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function PublicContactForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileHint, setFileHint] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [devNotice, setDevNotice] = useState(false);

  const totalBytes = files.reduce((a, f) => a + f.size, 0);

  const tryAddFiles = useCallback((incoming: FileList | File[]) => {
    setFileHint(null);
    const list = [...incoming].filter((f) => f.size > 0);
    if (list.length === 0) return;

    setFiles((prev) => {
      let next = [...prev];
      for (const f of list) {
        if (!isAllowedSupportFile(f.type, f.name)) {
          setFileHint(`Skipped “${f.name}” — only ${supportAttachmentMimeLabel()}.`);
          continue;
        }
        if (f.size > SUPPORT_MAX_SINGLE_FILE_BYTES) {
          setFileHint(`“${f.name}” is too large (max ${formatBytes(SUPPORT_MAX_SINGLE_FILE_BYTES)} per file).`);
          continue;
        }
        if (next.length >= SUPPORT_MAX_ATTACHMENTS) {
          setFileHint(`You can attach up to ${SUPPORT_MAX_ATTACHMENTS} files.`);
          break;
        }
        const dup = next.some((e) => e.name === f.name && e.size === f.size);
        if (dup) continue;
        const newTotal = next.reduce((s, x) => s + x.size, 0) + f.size;
        if (newTotal > SUPPORT_MAX_TOTAL_ATTACHMENT_BYTES) {
          setFileHint(
            `Total size would exceed ${formatBytes(SUPPORT_MAX_TOTAL_ATTACHMENT_BYTES)}. Remove a file or pick a smaller one.`
          );
          break;
        }
        next = [...next, f];
      }
      return next;
    });
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileHint(null);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    setDevNotice(false);
    setFileHint(null);
    try {
      const fd = new FormData();
      fd.append("email", email);
      fd.append("subject", subject);
      fd.append("message", message);
      fd.append(BOT_HONEYPOT_FIELD, "");
      for (const f of files) fd.append("files", f);

      const res = await fetch("/api/contact", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; loggedToConsole?: boolean };
      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setStatus("success");
      if (data.loggedToConsole) setDevNotice(true);
      setEmail("");
      setSubject("");
      setMessage("");
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setStatus("error");
      setError("Network error — check your connection and try again.");
    }
  }

  const [dragOver, setDragOver] = useState(false);

  return (
    <form
      onSubmit={onSubmit}
      className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_-10px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/[0.04] dark:border-slate-700/80 dark:bg-slate-900/60 dark:shadow-[0_10px_36px_-12px_rgba(0,0,0,0.55)] dark:ring-white/[0.05]"
    >
      <div className="border-b border-slate-100 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50/50 px-6 py-5 dark:border-slate-700/50 dark:from-indigo-950/30 dark:via-slate-900/80 dark:to-slate-950/50">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Send a message and we’ll reply by email.
        </p>
      </div>

      <div className="space-y-5 px-6 py-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="contact-email">
              Your email
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              maxLength={200}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-950"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="contact-subject">
              Subject
            </label>
            <input
              id="contact-subject"
              name="subject"
              required
              minLength={3}
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What can we help with?"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-950"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="contact-message">
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            minLength={10}
            maxLength={8000}
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what you need help with. You can attach screenshots or PDFs below."
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-950"
          />
          <p className="mt-1.5 text-right text-[11px] text-slate-400 dark:text-slate-500">
            {message.length.toLocaleString()} / 8,000
          </p>
        </div>

        <div>
          <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
            Attachments{" "}
            <span className="font-normal text-slate-500 dark:text-slate-400">(optional)</span>
          </span>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {supportAttachmentMimeLabel()} · up to {SUPPORT_MAX_ATTACHMENTS} files · {formatBytes(SUPPORT_MAX_SINGLE_FILE_BYTES)} each ·{" "}
            {formatBytes(SUPPORT_MAX_TOTAL_ATTACHMENT_BYTES)} total
          </p>
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,application/pdf,image/png,image/jpeg,image/webp,image/gif,text/plain"
            onChange={(e) => {
              if (e.target.files?.length) tryAddFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(false);
              if (e.dataTransfer.files?.length) tryAddFiles(e.dataTransfer.files);
            }}
            className={
              "mt-2 flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors " +
              (dragOver
                ? "border-indigo-400 bg-indigo-50/80 dark:border-indigo-500 dark:bg-indigo-950/40"
                : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-600 dark:bg-slate-950/40 dark:hover:border-slate-500 dark:hover:bg-slate-900/50")
            }
          >
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Drop files here or click to browse</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {files.length} / {SUPPORT_MAX_ATTACHMENTS} files · {formatBytes(totalBytes)} total
            </span>
          </button>

          {fileHint && (
            <p className="mt-2 text-xs text-amber-800 dark:text-amber-200/90" role="status">
              {fileHint}
            </p>
          )}

          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}-${f.size}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950/50"
                >
                  <span className="min-w-0 truncate text-slate-800 dark:text-slate-200" title={f.name}>
                    {f.name}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{formatBytes(f.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {status === "error" && error && (
          <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:bg-red-950/35 dark:text-red-200">
            {error}
          </p>
        )}

        {status === "success" && (
          <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-200">
            Thanks — your message was sent. We’ll reply to <span className="font-semibold">{email || "your email"}</span>.
            {devNotice ? (
              <span className="mt-1 block text-emerald-800/90 dark:text-emerald-300/90">
                (Dev: Resend isn’t configured — check the server terminal for the logged message.)
              </span>
            ) : null}
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700/50">
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {status === "loading" ? "Sending…" : "Send message"}
          </button>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 sm:text-right">
            Prefer email? Reach us from the footer link.
          </p>
        </div>
      </div>
    </form>
  );
}

