"use client";

import { useThemePreference } from "./ThemeProvider";
import { readDomColorScheme, resolveEffectiveColorScheme } from "@/lib/theme-preference";

type Props = {
  className?: string;
  /** Tighter padding for nav drawers. */
  compact?: boolean;
  /** Hide “Appearance” caption (e.g. marketing header). */
  hideCaption?: boolean;
  /** Switch only (no “Light”/“Dark” text) — use in tight layouts; rely on aria-label + title. */
  iconOnly?: boolean;
  /**
   * Dashboard sidebar: one row (“Theme” + switch), no outer panel chrome —
   * parent provides the card and dividers.
   */
  embed?: boolean;
};

export function ThemeToggle({ className = "", compact, hideCaption, iconOnly, embed }: Props) {
  const { preference, setPreference, mounted } = useThemePreference();
  const effective = mounted ? resolveEffectiveColorScheme(preference) : readDomColorScheme();
  const isDark = effective === "dark";
  const modeLabel = isDark ? "Dark" : "Light";

  const wantsFullWidth = !embed && !hideCaption;
  const controlButtonClass = embed
    ? "inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-800 "
    : iconOnly
      ? "inline-flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200/90 bg-white/95 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-600/80 dark:bg-slate-800/70 dark:hover:bg-slate-800 "
      : "inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200/90 bg-slate-50/90 px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100/90 dark:border-slate-600/80 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800/80 " +
        (wantsFullWidth ? "w-full " : "w-max ") +
        (compact ? "" : "sm:px-3 ");

  const track = (
    <span
      className={
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-px transition-colors duration-200 " +
        (isDark ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-500")
      }
      aria-hidden
    >
      <span
        className={
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out " +
          (isDark ? "translate-x-4" : "translate-x-0.5")
        }
      />
    </span>
  );

  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Use light theme" : "Use dark theme"}
      disabled={!mounted}
      onClick={() => setPreference(isDark ? "light" : "dark")}
      className={
        controlButtonClass + (!mounted ? "cursor-wait opacity-70" : "touch-manipulation")
      }
    >
      {!iconOnly && <span className="tabular-nums">{modeLabel}</span>}
      {track}
    </button>
  );

  if (embed) {
    return (
      <div className={"flex items-center gap-3 " + className}>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Theme</span>
        {control}
        {!mounted ? (
          <span className="sr-only">Loading theme preference</span>
        ) : (
          <span className="sr-only">
            Color theme: {effective}. Currently {modeLabel.toLowerCase()} mode.
          </span>
        )}
      </div>
    );
  }

  if (hideCaption) {
    return (
      <div className={className}>
        {control}
        {!mounted ? (
          <span className="sr-only">Loading theme preference</span>
        ) : (
          <span className="sr-only">
            Color theme: {effective}. Currently {modeLabel.toLowerCase()} mode.
          </span>
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
      {control}
      {!mounted ? (
        <span className="sr-only">Loading theme preference</span>
      ) : (
        <span className="sr-only">
          Color theme: {effective}. Currently {modeLabel.toLowerCase()} mode.
        </span>
      )}
    </div>
  );
}
