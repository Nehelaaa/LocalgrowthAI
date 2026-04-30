"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import type { FC } from "react";
import { ManageBillingButton } from "./ManageBillingButton";
import { UpgradeButton } from "./UpgradeButton";

const nav: {
  href: string;
  label: string;
  shortLabel: string;
  icon: FC<{ className?: string }>;
}[] = [
  {
    href: "/dashboard",
    label: "Overview",
    shortLabel: "Home",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/plan",
    label: "Plan & billing",
    shortLabel: "Plan",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
        />
      </svg>
    ),
  },
  {
    href: "/dashboard/search",
    label: "Find Businesses",
    shortLabel: "Search",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/leads",
    label: "CRM Leads",
    shortLabel: "Leads",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    href: "/dashboard/export",
    label: "Export",
    shortLabel: "Export",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
];

const tradesItem: (typeof nav)[0] = {
  href: "/dashboard/trades",
  label: "Trades (field service)",
  shortLabel: "Trades",
  icon: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.163-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  ),
};

const ownerItem: (typeof nav)[0] = {
  href: "/owner",
  label: "Owner",
  shortLabel: "Owner",
  icon: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75l2.25 4.5 4.97.72-3.6 3.5.85 4.96L12 15.9l-4.47 2.35.85-4.96-3.6-3.5 4.97-.72L12 3.75Z" />
    </svg>
  ),
};

function buildNavItems(showTrades: boolean, showOwner: boolean) {
  const out = [...nav];
  if (showTrades) {
    // Insert after Overview (for agencies + trades users who do both).
    out.splice(1, 0, tradesItem);
  }
  if (showOwner) {
    // Put Owner at top so it’s easy to find.
    out.splice(1, 0, ownerItem);
  }
  // Always keep billing last, regardless of optional items.
  const billingIdx = out.findIndex((i) => i.href === "/dashboard/plan");
  if (billingIdx >= 0) {
    const [billing] = out.splice(billingIdx, 1);
    out.push(billing);
  }
  if (!showTrades && !showOwner) return out;
  return out;
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function NavList({
  pathname,
  onNavigate,
  compact,
  items,
}: {
  pathname: string;
  onNavigate?: () => void;
  compact?: boolean;
  items: typeof nav;
}) {
  return (
    <nav className="space-y-1.5 p-3" aria-label="Dashboard">
      {items.map((item) => {
        const isOwner = item.href === "/owner";
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={
              "group flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 touch-manipulation " +
              (active
                ? "bg-indigo-50 text-indigo-800 shadow-sm ring-1 ring-indigo-200/60 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/30"
                : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 active:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white")
            }
          >
            <span
              className={
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors " +
                (active
                  ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                  : "bg-slate-100/80 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 group-hover:dark:bg-slate-700 group-hover:dark:text-slate-200")
              }
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 truncate">
              {compact ? item.shortLabel : item.label}
            </span>
            {isOwner && (
              <span className="ml-auto rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                owner
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandBlock({ small }: { small?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="group flex items-center gap-2 transition hover:opacity-90 touch-manipulation"
    >
      <Image
        src="/favicon.svg"
        alt="LocalLeadster"
        className={
          "rounded-xl shadow-md shadow-indigo-500/20 " + (small ? "h-8 w-8" : "h-9 w-9")
        }
        width={small ? 32 : 36}
        height={small ? 32 : 36}
        priority
      />
      <span>
        <span
          className={
            (small ? "text-[15px] " : "text-[15px] ") +
            "block font-bold leading-tight tracking-tight text-slate-900 dark:text-white"
          }
        >
          LocalLeadster
        </span>
        {!small && <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pipeline</span>}
      </span>
    </Link>
  );
}

function FooterHome({
  user,
}: {
  user?: { email: string; name?: string | null; isPro: boolean };
}) {
  return (
    <div className="sticky bottom-0 z-10 shrink-0 space-y-2 border-t border-slate-200/80 bg-white/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60">
      {user && (
        <div className="rounded-xl border border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-white/70 p-3 shadow-sm dark:border-slate-700/50 dark:from-slate-800/40 dark:to-slate-900/30">
          <p className="truncate text-xs font-semibold text-slate-600 dark:text-slate-300">
            {user.name || user.email}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            {user.isPro ? "Pro" : "Free plan"}
          </p>
          {!user.isPro && <UpgradeButton className="mt-2 w-full" label="Upgrade to Pro" />}
          {user.isPro && <ManageBillingButton className="mt-2 w-full" />}
        </div>
      )}
      <div className="rounded-xl border border-slate-200/80 bg-white/70 p-1 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/20">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="group flex w-full min-h-[44px] items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:text-slate-200 dark:hover:bg-red-950/30 dark:hover:text-red-200"
        >
          <span>Sign out</span>
          <svg
            className="h-4 w-4 text-slate-400 transition-colors group-hover:text-red-500 dark:text-slate-500 dark:group-hover:text-red-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9l3 3-3 3m3-3H8.25" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function DashboardNav({
  user,
}: {
  user?: {
    email: string;
    name?: string | null;
    isPro: boolean;
    showTrades?: boolean;
    showOwner?: boolean;
  };
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = buildNavItems(Boolean(user?.showTrades), Boolean(user?.showOwner));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  const close = () => setMobileOpen(false);

  return (
    <div className="w-0 shrink-0 overflow-visible lg:w-64">
      <header
        className="fixed top-0 left-0 right-0 z-40 flex h-14 w-full max-h-[calc(3.5rem+env(safe-area-inset-top))] items-center gap-3 border-b border-slate-200/80 bg-white/95 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.25rem,env(safe-area-inset-top))] shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/95 lg:hidden"
      >
        <div className="min-w-0 flex-1">
          <BrandBlock small />
        </div>
        <button
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          className="ms-auto min-h-[44px] min-w-[44px] shrink-0 -mr-2 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 touch-manipulation"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 cursor-default bg-slate-900/40 backdrop-blur-[2px] dark:bg-black/50"
            onClick={close}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(20rem,92vw)] flex-col border-r border-slate-200/80 bg-gradient-to-b from-slate-50 to-white shadow-2xl dark:border-slate-800/80 dark:from-slate-950 dark:to-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] dark:border-slate-800/80">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 touch-manipulation"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <NavList pathname={pathname} onNavigate={close} compact items={navItems} />
            </div>
            <FooterHome user={user} />
          </aside>
        </div>
      )}

      <aside className="hidden h-screen min-h-0 w-64 min-w-0 border-r border-slate-200/80 bg-gradient-to-b from-slate-50 to-white shadow-[4px_0_32px_-8px_rgba(15,23,42,0.12)] dark:border-slate-800/80 dark:from-slate-950 dark:to-slate-900 dark:shadow-[4px_0_32px_-8px_rgba(0,0,0,0.45)] lg:sticky lg:top-0 lg:flex lg:flex-col">
        <div className="border-b border-slate-200/80 px-5 py-6 dark:border-slate-800/80">
          <BrandBlock />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavList pathname={pathname} items={navItems} />
        </div>
        <FooterHome user={user} />
      </aside>
    </div>
  );
}
