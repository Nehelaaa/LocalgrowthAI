"use client";

import { useEffect } from "react";

export default function OwnerUsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const msg = error.message ?? String(error);
  const unreachable =
    msg.includes("P1001") ||
    msg.includes("Can't reach database server") ||
    msg.includes("reach database server");

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-red-200 bg-red-50/90 p-6 text-slate-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-50">
      <h2 className="text-lg font-semibold">Could not load users</h2>
      {unreachable ? (
        <div className="space-y-2 text-sm leading-relaxed text-slate-800 dark:text-red-100/95">
          <p>
            The app cannot reach your PostgreSQL database (Prisma{" "}
            <code className="rounded bg-white/80 px-1 py-0.5 text-xs dark:bg-black/30">P1001</code>
            ).
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              In{" "}
              <a
                className="font-medium text-violet-700 underline dark:text-violet-300"
                href="https://console.neon.tech"
                rel="noreferrer"
                target="_blank"
              >
                Neon
              </a>
              , open your project and confirm it is not paused or suspended.
            </li>
            <li>
              Check <code className="rounded bg-white/80 px-1 text-xs dark:bg-black/30">DATABASE_URL</code>{" "}
              in <code className="rounded bg-white/80 px-1 text-xs dark:bg-black/30">.env</code> (pooled
              host usually contains <code className="rounded bg-white/80 px-1 text-xs dark:bg-black/30">-pooler</code>
              ).
            </li>
            <li>
              If only the pooler fails on your network, try in{" "}
              <code className="rounded bg-white/80 px-1 text-xs dark:bg-black/30">.env</code>:{" "}
              <code className="rounded bg-white/80 px-1 text-xs dark:bg-black/30">PRISMA_USE_DIRECT_URL=1</code>{" "}
              (uses <code className="rounded bg-white/80 px-1 text-xs dark:bg-black/30">DIRECT_URL</code> for local
              queries; keep pooled URL on Vercel).
            </li>
            <li>
              If the connection string includes{" "}
              <code className="rounded bg-white/80 px-1 text-xs dark:bg-black/30">channel_binding=require</code>{" "}
              and issues persist, try removing that parameter for local dev (see Neon / driver notes).
            </li>
          </ul>
        </div>
      ) : (
        <pre className="max-h-48 overflow-auto rounded-lg bg-white/80 p-3 text-xs whitespace-pre-wrap dark:bg-black/30">
          {msg}
        </pre>
      )}
      <button
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-red-200 dark:text-red-950 dark:hover:bg-red-100"
        type="button"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
