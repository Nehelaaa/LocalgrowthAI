"use client";

import { useEffect, useRef, useState } from "react";
import type { ContactStatus } from "@prisma/client";
import {
  CONTACT_STATUS_ORDER,
  contactStatusLabel,
  contactStatusDotClass,
} from "@/lib/contact-status";

type LeadVariant = {
  variant: "lead";
  value: ContactStatus;
  onChange: (v: ContactStatus) => void | Promise<void>;
  disabled?: boolean;
};

type FilterVariant = {
  variant: "filter";
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
};

type Props = LeadVariant | FilterVariant;

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400 ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25 12 15.75l-7.5-7.5" />
    </svg>
  );
}

function Check() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function StatusRow({
  dotClass,
  label,
  selected,
  onSelect,
}: {
  dotClass: string;
  label: string;
  selected: boolean;
  onSelect: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => void onSelect()}
      className={
        "group/opt flex w-full touch-manipulation items-center gap-3 rounded-xl px-3 py-2.5 text-left transition " +
        (selected
          ? "bg-slate-100/90 dark:bg-slate-800/60"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/50")
      }
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
      <span className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
        {label}
      </span>
      {selected && <Check />}
    </button>
  );
}

export function ContactStatusPicker(props: Props) {
  const { variant, disabled } = props;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isFilter = variant === "filter";
  const filterVal = isFilter ? props.value : "";
  const isAll =
    isFilter &&
    (!filterVal || !CONTACT_STATUS_ORDER.includes(filterVal as ContactStatus));
  const current: { label: string; dot: string } | null =
    isAll
      ? { label: "All statuses", dot: "bg-slate-400" }
      : (() => {
          const s = (isFilter ? (filterVal as ContactStatus) : props.value) as ContactStatus;
          return { label: contactStatusLabel[s], dot: contactStatusDotClass[s] };
        })();

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        id="contact-status-button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          "group flex w-full touch-manipulation items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-left shadow-sm transition " +
          "hover:border-slate-300/90 hover:shadow-md active:scale-[0.995] " +
          "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-0 " +
          "dark:border-slate-600/40 dark:bg-slate-900/30 dark:hover:border-slate-500/50" +
          (disabled ? " cursor-not-allowed opacity-50" : " cursor-pointer")
        }
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">
          {current && (
            <>
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${current.dot}`}
              />
              <span className="truncate text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                {current.label}
              </span>
            </>
          )}
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          className="absolute z-50 mt-2 max-h-[min(20rem,50dvh)] w-full min-w-[240px] overflow-y-auto overflow-x-hidden overscroll-contain rounded-2xl border border-slate-200/50 bg-white/95 p-1 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/[0.04] backdrop-blur-sm dark:border-slate-600/30 dark:bg-slate-900/95 dark:shadow-black/20 dark:ring-white/[0.06]"
          role="listbox"
          aria-labelledby="contact-status-button"
        >
          {isFilter && (
            <li>
              <StatusRow
                dotClass="bg-slate-400 dark:bg-slate-500"
                label="All statuses"
                selected={isAll}
                onSelect={() => {
                  props.onChange("");
                  setOpen(false);
                }}
              />
            </li>
          )}
          {CONTACT_STATUS_ORDER.map((s) => {
            const selected = props.value === s;
            return (
              <li key={s}>
                <StatusRow
                  dotClass={contactStatusDotClass[s]}
                  label={contactStatusLabel[s]}
                  selected={selected}
                  onSelect={async () => {
                    if (props.variant === "lead") {
                      await props.onChange(s);
                    } else {
                      props.onChange(s);
                    }
                    setOpen(false);
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
