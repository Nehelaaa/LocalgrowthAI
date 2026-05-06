"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** IntersectionObserver rootMargin — slightly positive bottom reveals a bit earlier while scrolling down. */
  rootMargin?: string;
};

/**
 * Subtle scroll reveal for marketing sections. Respects `prefers-reduced-motion`.
 */
export function MarketingReveal({ children, className = "", rootMargin = "0px 0px -8% 0px" }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries[0];
        if (!hit?.isIntersecting) return;
        setVisible(true);
        io.unobserve(el);
        io.disconnect();
      },
      { rootMargin, threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={`lgai-section-reveal ${visible ? "lgai-section-reveal-in" : ""} ${className}`}>
      {children}
    </div>
  );
}
