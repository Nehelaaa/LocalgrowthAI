"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";

/** Theme control for auth/onboarding — bottom-right on small screens so it never covers the card header. */
export function AuthThemeCorner() {
  return (
    <div
      className={
        "pointer-events-auto fixed z-[80] w-max max-w-[calc(100vw-2rem)] " +
        "bottom-6 right-3 " +
        "sm:bottom-auto sm:right-5 sm:top-5 sm:pt-[max(0px,env(safe-area-inset-top))]"
      }
    >
      <ThemeToggle
        hideCaption
        compact
        className="rounded-xl border border-slate-200/90 bg-white/95 p-1.5 shadow-md backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/95"
      />
    </div>
  );
}
