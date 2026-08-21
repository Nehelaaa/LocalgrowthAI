"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { label: "Cities to search", value: 200, suffix: "+", from: 0 },
  { label: "Lead quality tiers", value: 3, suffix: "", from: 0 },
  { label: "Pipeline stages", value: 5, suffix: "", from: 0 },
];

function useCountTo(target: number, durationMs: number) {
  const [n, setN] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    let raf: number;
    const tick = (t: number) => {
      if (startRef.current == null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / durationMs);
      setN(Math.round(p * (target - 0)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return n;
}

export function StatsStrip() {
  return (
    <ul className="grid gap-4 sm:grid-cols-3" role="list">
      {stats.map((s) => (
        <li
          key={s.label}
          className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/90 p-5 text-center shadow-sm ring-1 ring-slate-200/50 dark:border-slate-700/80 dark:from-slate-900/60 dark:to-slate-900/30 dark:ring-slate-700/40"
        >
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 sm:text-3xl">
            <CountCell target={s.value} suffix={s.suffix} />
          </div>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">{s.label}</p>
        </li>
      ))}
    </ul>
  );
}

function CountCell({ target, suffix }: { target: number; suffix: string }) {
  const n = useCountTo(target, 1400);
  return (
    <>
      {n}
      {suffix}
    </>
  );
}
