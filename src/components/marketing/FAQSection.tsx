"use client";

import { useId, useState } from "react";
import { marketingFaqs as faqs } from "@/lib/marketing/faq";

export function FAQSection() {
  const [open, setOpen] = useState(0);
  const baseId = useId();
  return (
    <section
      id="faq"
      className="scroll-mt-20 py-16 sm:py-20"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2
          id="faq-heading"
          className="text-center text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white"
        >
          Questions, answered
        </h2>
        <p className="mt-2 text-center text-slate-600 dark:text-slate-400">
          Clear answers for teams evaluating the product.
        </p>
        <div className="mt-8 space-y-2">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            const panelId = `${baseId}-panel-${i}`;
            const buttonId = `${baseId}-btn-${i}`;
            return (
              <div
                key={f.q}
                className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-700/50 dark:bg-slate-900/40"
              >
                <button
                  id={buttonId}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800/50"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  {f.q}
                  <span
                    className={
                      "text-lg text-indigo-600 transition dark:text-indigo-400 " +
                      (isOpen ? "rotate-45" : "")
                    }
                    aria-hidden
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300"
                  >
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
