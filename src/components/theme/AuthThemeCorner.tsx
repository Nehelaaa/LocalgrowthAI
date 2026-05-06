"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";

/** Fixed control for auth/onboarding pages (no dashboard nav). */
export function AuthThemeCorner() {
  return (
    <div className="pointer-events-auto fixed right-3 top-3 z-[80] w-[min(calc(100vw-1.5rem),9.5rem)] pt-[max(0px,env(safe-area-inset-top))] sm:right-5 sm:top-5">
      <ThemeToggle
        hideCaption
        compact
        className="rounded-xl border border-slate-200/90 bg-white/95 p-1.5 shadow-md backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/95"
      />
    </div>
  );
}
