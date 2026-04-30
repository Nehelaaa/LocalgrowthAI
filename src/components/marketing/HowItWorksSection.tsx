"use client";

import Image from "next/image";
import { useState } from "react";

const steps = [
  {
    id: 1,
    title: "Search a territory",
    body: "Pick city, state, radius, and industry. We pull live Google Places data so you only talk to real businesses in your service area.",
    image:
      "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=900&q=80&auto=format&fit=crop",
    alt: "Map and location planning for local business search",
  },
  {
    id: 2,
    title: "Flag & score leads",
    body: "Instantly see who has no real website or only social. HOT / WARM / COLD scores help you prioritize the best opportunities first.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80&auto=format&fit=crop",
    alt: "Dashboard analytics and lead metrics on a screen",
  },
  {
    id: 3,
    title: "Run your pipeline",
    body: "Track contact status, notes, follow-up dates, and value in a built-in CRM. No more scattered spreadsheets for your web dev sales.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80&auto=format&fit=crop",
    alt: "CRM and pipeline on laptop",
  },
  {
    id: 4,
    title: "Outreach & close (Pro)",
    body: "Generate channel-specific copy with AI, export to your stack, and spin up a client demo page to win the deal — all in one product.",
    image:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=80&auto=format&fit=crop",
    alt: "Business handshake and closing a deal",
  },
];

export function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const s = steps[active]!;

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 py-16 dark:border-slate-800/80 dark:from-slate-950 dark:to-slate-900/50 sm:py-24"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="how-heading"
          className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl dark:text-white"
        >
          How LocalLeadster works
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-600 dark:text-slate-400">
          Four simple steps from map to contract. Click a step to explore.
        </p>

        <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start">
          <ol className="flex w-full flex-col gap-2 lg:max-w-sm" role="list">
            {steps.map((step, i) => {
              const on = i === active;
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className={
                      "w-full rounded-xl border p-4 text-left transition " +
                      (on
                        ? "border-indigo-400/60 bg-indigo-50/90 shadow-md ring-2 ring-indigo-500/20 dark:border-indigo-500/50 dark:bg-indigo-500/10"
                        : "border-slate-200/80 bg-white/60 hover:border-slate-300 dark:border-slate-700/50 dark:bg-slate-900/30 dark:hover:border-slate-600")
                    }
                    aria-current={on ? "step" : undefined}
                  >
                    <span
                      className={
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold " +
                        (on
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200")
                      }
                    >
                      {step.id}
                    </span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                      {step.title}
                    </span>
                    {on && (
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {step.body}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="relative min-h-[220px] flex-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-lg dark:border-slate-700/50 dark:bg-slate-800/50 sm:min-h-[320px] lg:min-h-[400px]">
            <Image
              key={s.id}
              src={s.image}
              alt={s.alt}
              fill
              className="object-cover transition duration-500"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority={active === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
            <p className="absolute bottom-3 left-3 right-3 text-sm font-medium text-white drop-shadow sm:bottom-4 sm:left-4 sm:text-base">
              {s.title}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
