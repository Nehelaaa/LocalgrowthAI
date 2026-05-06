export const THEME_STORAGE_KEY = "localleadster-theme";

export type ThemePreference = "light" | "dark" | "system";

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Resolved UI theme for a stored preference (treats `system` via `prefers-color-scheme`). */
export function resolveEffectiveColorScheme(pref: ThemePreference): "light" | "dark" {
  if (pref === "dark") return "dark";
  if (pref === "light") return "light";
  return systemPrefersDark() ? "dark" : "light";
}

/** Applies `dark` class on `<html>` for Tailwind `dark:` utilities (see globals.css `@custom-variant`). */
export function applyThemePreference(pref: ThemePreference): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (pref === "dark") {
    root.classList.add("dark");
  } else if (pref === "light") {
    root.classList.remove("dark");
  } else {
    root.classList.toggle("dark", systemPrefersDark());
  }
  root.style.colorScheme = resolveEffectiveColorScheme(pref);
}

/** Enables CSS theme transitions after paint (avoids animating the first paint / hydration). */
export function markThemeTransitionsReady(): void {
  if (typeof document === "undefined") return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.setAttribute("data-lgai-theme-ready", "1");
    });
  });
}

export function readStoredThemePreference(): ThemePreference | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* private mode etc. */
  }
  return null;
}

/** Inline in root layout — runs before paint to reduce theme flash (class + native `color-scheme`). */
export const THEME_BOOT_SCRIPT = `!function(){try{var k='${THEME_STORAGE_KEY}',d=document.documentElement,m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches,s=null;try{s=localStorage.getItem(k)}catch(e){}if(s==='dark'){d.classList.add('dark');d.style.colorScheme='dark'}else if(s==='light'){d.classList.remove('dark');d.style.colorScheme='light'}else{d.classList.toggle('dark',!!m);d.style.colorScheme=m?'dark':'light'}}catch(e){}}();`;
