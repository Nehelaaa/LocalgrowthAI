"use client";

import { useThemePreference } from "./ThemeProvider";
import type { ThemePreference } from "@/lib/theme-preference";

const modes: { id: ThemePreference; label: string; short: string }[] = [
  { id: "light", label: "Light theme", short: "Light" },
  { id: "system", label: "Match device (system)", short: "Auto" },
  { id: "dark", label: "Dark theme", short: "Dark" },
];

type Props = {
  className?: string;
  /** Tighter padding for nav drawers. */
  compact?: boolean;
  /** Hide “Appearance” caption (e.g. marketing header). */
  hideCaption?: boolean;
};

export function ThemeToggle({ className = "", compact, hideCaption }: Props) {
  const { preference, setPreference, mounted } = useThemePreference();

  const group = (
    <div
      className={
        "inline-flex w-full rounded-lg border border-slate-200/90 bg-slate-50/90 p-0.5 dark:border-slate-600/80 dark:bg-slate-800/50 " +
        (compact ? "max-w-full" : "")
      }
      role="group"
      aria-label="Color theme"
    >
      {modes.map((m) => {
        const active = mounted && preference === m.id;
        return (
          <button
            key={m.id}
            type="button"
            title={m.label}
            aria-pressed={active}
            aria-label={m.label}
            disabled={!mounted}
            onClick={() => setPreference(m.id)}
            className={
              "min-h-9 flex-1 rounded-md px-1.5 text-center text-[11px] font-semibold transition-colors duration-200 touch-manipulation sm:px-2 sm:text-xs " +
              (active
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-700 dark:text-white dark:ring-slate-600/80"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100")
            }
          >
            {m.short}
          </button>
        );
      })}
    </div>
  );

  if (hideCaption) {
    return (
      <div className={className}>
        {group}
        {!mounted ? (
          <span className="sr-only">Loading theme preference</span>
        ) : (
          <span className="sr-only">Current theme: {preference}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={
        "flex flex-col gap-1.5 " +
        (compact ? "" : "rounded-xl border border-slate-200/90 bg-white/80 p-2 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/50 ") +
        className
      }
    >
      <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Appearance
      </p>
      {group}
      {!mounted ? (
        <span className="sr-only">Loading theme preference</span>
      ) : (
        <span className="sr-only">Current theme: {preference}</span>
      )}
    </div>
  );
}

