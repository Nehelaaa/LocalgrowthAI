"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/owner", label: "Overview" },
  { href: "/owner/users", label: "Users" },
  { href: "/owner/revenue", label: "Revenue" },
  { href: "/owner/churn", label: "Churn" },
  { href: "/owner/billing-playbook", label: "Billing playbook" },
  { href: "/owner/usage", label: "Usage" },
  { href: "/owner/costs", label: "Costs & margin" },
  { href: "/owner/alerts", label: "Alerts" },
  { href: "/owner/flags", label: "Feature flags" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/owner"
    ? pathname === "/owner"
    : pathname === href || pathname.startsWith(href + "/");
}

export function AdminShell({
  children,
  ownerEmail,
  impersonating,
}: {
  children: React.ReactNode;
  ownerEmail: string;
  impersonating: null | { userId: string; email: string };
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-[100dvh] bg-slate-100/70 dark:bg-slate-950">
      <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/60">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/favicon.svg"
              alt="LocalLeadster"
              width={32}
              height={32}
              className="h-8 w-8 rounded-xl shadow-sm"
              priority
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Owner dashboard
              </p>
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                {ownerEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {impersonating ? (
              <div className="hidden items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200 sm:flex">
                <span className="font-semibold">Impersonating</span>
                <span className="max-w-[240px] truncate">{impersonating.email}</span>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch("/api/owner/impersonate/stop", { method: "POST" });
                    window.location.reload();
                  }}
                  className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white"
                >
                  Stop
                </button>
              </div>
            ) : null}

            <Link
              href="/dashboard"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              Back to app
            </Link>

            <Link
              href="/sign-out"
              prefetch={false}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-rose-900/40 dark:hover:bg-rose-950/30 dark:hover:text-rose-200"
            >
              Sign out
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl gap-4 px-3 py-4 sm:px-4 lg:gap-6 lg:px-6 lg:py-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-[88px] space-y-3">
            {impersonating && (
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                <p className="font-semibold">Impersonating</p>
                <p className="mt-1 truncate">{impersonating.email}</p>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch("/api/owner/impersonate/stop", { method: "POST" });
                    window.location.reload();
                  }}
                  className="mt-3 min-h-10 w-full rounded-xl bg-amber-600 px-3 text-xs font-semibold text-white"
                >
                  Stop impersonating
                </button>
              </div>
            )}

            <nav className="rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
              {items.map((i) => {
                const active = isActive(pathname, i.href);
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    className={
                      "group flex min-h-[44px] items-center justify-between rounded-xl px-3 text-sm font-medium transition " +
                      (active
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/60")
                    }
                  >
                    <span>{i.label}</span>
                    <span
                      className={
                        "h-1.5 w-1.5 rounded-full " +
                        (active ? "bg-white/90" : "bg-slate-300 group-hover:bg-slate-400 dark:bg-slate-700")
                      }
                    />
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 lg:hidden">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
              <div className="flex flex-nowrap gap-2 overflow-x-auto px-1 py-1">
                {items.map((i) => {
                  const active = isActive(pathname, i.href);
                  return (
                    <Link
                      key={i.href}
                      href={i.href}
                      className={
                        "shrink-0 rounded-full px-3 py-2 text-sm font-semibold " +
                        (active
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200")
                      }
                    >
                      {i.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

