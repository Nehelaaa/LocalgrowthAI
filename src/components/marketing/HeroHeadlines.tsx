"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const HEADLINES = [
  "Stop wasting hours searching for local business leads manually",
  "Find high-intent local businesses in minutes",
  "Prospect locally with follow-ups and pipeline stages in one workspace",
  "Local outreach workflows without spreadsheet chaos",
] as const;

function subscribePrefersReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getPrefersReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getPrefersReducedMotionServerSnapshot() {
  return false;
}

export function HeroHeadlines() {
  const [i, setI] = useState(0);
  const reduceMotion = useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotionSnapshot,
    getPrefersReducedMotionServerSnapshot
  );

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setI((n) => (n + 1) % HEADLINES.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const line = reduceMotion ? HEADLINES[0] : HEADLINES[i]!;

  return (
    <h1
      id="hero-heading"
      aria-live={reduceMotion ? undefined : "polite"}
      className="mt-3 min-h-[3.25rem] text-3xl font-bold leading-tight tracking-tight text-slate-900 transition-opacity duration-500 dark:text-white sm:min-h-[3.5rem] sm:text-4xl md:min-h-[4rem] md:text-5xl lg:text-[2.75rem] lg:leading-[1.12]"
    >
      {line}
    </h1>
  );
}
