"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-11 min-w-[44px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800"
    >
      Print / save PDF
    </button>
  );
}
