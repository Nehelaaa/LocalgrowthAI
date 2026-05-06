"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyThemePreference,
  markThemeTransitionsReady,
  readStoredThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme-preference";

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  /** False until client reads localStorage — toggles can wait to avoid hydration mismatch. */
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useThemePreference(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemePreference must be used within ThemeProvider");
  }
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = readStoredThemePreference();
      if (stored) {
        startTransition(() => setPreferenceState(stored));
      }
      applyThemePreference(stored ?? "system");
      setMounted(true);
      markThemeTransitionsReady();
    });
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY || e.newValue == null) return;
      if (e.newValue === "light" || e.newValue === "dark" || e.newValue === "system") {
        startTransition(() => setPreferenceState(e.newValue as ThemePreference));
        applyThemePreference(e.newValue as ThemePreference);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyThemePreference(preference);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      /* ignore */
    }
    if (preference === "light" || preference === "dark") {
      return undefined;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readStoredThemePreference() !== "system") return;
      applyThemePreference("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mounted, preference]);

  const setPreference = useCallback((p: ThemePreference) => {
    startTransition(() => setPreferenceState(p));
  }, []);

  const value = useMemo(
    () => ({ preference, setPreference, mounted }),
    [preference, mounted, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
