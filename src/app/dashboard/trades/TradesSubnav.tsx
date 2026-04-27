"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard/trades", label: "Home" },
  { href: "/dashboard/trades/calls", label: "Calls" },
  { href: "/dashboard/trades/schedule", label: "Schedule" },
  { href: "/dashboard/trades/customers", label: "Customers" },
];

export function TradesSubnav() {
  const pathname = usePathname();
  return (
    <div className="mb-4 -mx-1 sm:mx-0">
      <nav
        className="flex flex-nowrap gap-1 overflow-x-auto overflow-y-hidden rounded-2xl border border-amber-200/60 bg-amber-50/50 p-1.5 sm:flex-wrap sm:overflow-visible dark:border-amber-900/40 dark:bg-amber-950/25"
        aria-label="Trades"
      >
        {items.map((i) => {
          const exact = i.href === "/dashboard/trades";
          const active = exact
            ? pathname === i.href
            : pathname === i.href || pathname.startsWith(`${i.href}/`);
          return (
            <Link
              key={i.href}
              href={i.href}
              className={
                "shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-medium transition min-h-[44px] min-w-12 inline-flex items-center justify-center " +
                (active
                  ? "bg-amber-600 text-white shadow"
                  : "text-amber-900/80 hover:bg-white/80 dark:text-amber-200 dark:hover:bg-slate-800/80")
              }
            >
              {i.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
