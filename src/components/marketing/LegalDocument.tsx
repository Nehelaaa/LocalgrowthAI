import type { ReactNode } from "react";

export function LegalDocument({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Last updated: {lastUpdated}
      </p>
      <div
        className={[
          "mt-10 space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300",
          "[&_h2]:mt-10 [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 dark:[&_h2]:text-white",
          "[&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-white",
          "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5",
          "[&_a]:font-medium [&_a]:text-indigo-600 [&_a]:underline-offset-2 hover:[&_a]:underline dark:[&_a]:text-indigo-400",
          "[&_p]:text-slate-700 dark:[&_p]:text-slate-300",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
