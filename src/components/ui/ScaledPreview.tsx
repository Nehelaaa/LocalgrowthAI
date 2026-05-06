"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";

type Props = {
  /** The unscaled "design" size we render at (e.g. a real PDF layout). */
  designWidth: number;
  /**
   * The unscaled "design" height.
   * If omitted, we measure the child content height at designWidth and use that.
   */
  designHeight?: number;
  /**
   * Optional max height for the preview area (in px).
   * If provided, we will scale down further to stay within this height.
   */
  maxHeight?: number;
  /** Extra classes for the outer wrapper. */
  className?: string;
  /** Extra classes for the inner (scaled) page container. */
  pageClassName?: string;
  children: React.ReactNode;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function ScaledPreview({
  designWidth,
  designHeight,
  maxHeight,
  className = "",
  pageClassName = "",
  children,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [hostW, setHostW] = useState(0);
  const [measuredH, setMeasuredH] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (!r) return;
      setHostW(r.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (typeof designHeight === "number") return;
    const el = pageRef.current;
    if (!el) return;

    const measure = () => {
      const next = Math.ceil(el.scrollHeight);
      setMeasuredH((prev) => (prev === next ? prev : next));
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [designHeight]);

  const effectiveH = typeof designHeight === "number" ? designHeight : measuredH ?? 0;

  const scale = useMemo(() => {
    if (!hostW || !effectiveH) return 1;
    const sW = hostW / designWidth;
    const sH = typeof maxHeight === "number" ? maxHeight / effectiveH : Infinity;
    // Never upscale.
    return clamp(Math.min(sW, sH, 1), 0.2, 1);
  }, [hostW, designWidth, maxHeight, effectiveH]);

  const scaledW = Math.round(designWidth * scale);
  const scaledH = Math.round(effectiveH * scale);

  return (
    <div ref={hostRef} className={`relative w-full overflow-hidden ${className}`}>
      <div
        className="absolute left-1/2 top-0 origin-top"
        style={{ width: designWidth, height: effectiveH || undefined, transform: `translateX(-50%) scale(${scale})` }}
      >
        <div ref={pageRef} className={`w-full ${pageClassName}`}>
          {children}
        </div>
      </div>

      {/* Reserve space so layout matches scaled content (no blank excess). */}
      <div className="pointer-events-none" style={{ height: scaledH, width: scaledW }} aria-hidden />
    </div>
  );
}

