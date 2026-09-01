"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { FC } from "react";
import { ManageBillingButton } from "./ManageBillingButton";
import { UpgradeButton } from "./UpgradeButton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BRAND_WORDMARK_NAV } from "@/lib/brand-wordmark";

const nav: {
  href: string;
  label: string;
  icon: FC<{ className?: string }>;
}[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/plan",
    label: "Plan & billing",
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
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/leads",
    label: "CRM Leads",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    href: "/dashboard/invoice-templates",
    label: "Invoice templates",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
        />
      </svg>
    ),
  },
  {
    href: "/dashboard/payments",
    label: "Invoice payments",
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
];

const tradesItem: (typeof nav)[0] = {
  href: "/dashboard/trades",
  label: "Trades (field service)",
  icon: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.163-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  ),
};

const ownerItem: (typeof nav)[0] = {
  href: "/owner",
  label: "Owner",
  icon: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75l2.25 4.5 4.97.72-3.6 3.5.85 4.96L12 15.9l-4.47 2.35.85-4.96-3.6-3.5 4.97-.72L12 3.75Z" />
    </svg>
  ),
};

type NavItem = (typeof nav)[0];
type NavSection = { label?: string; items: NavItem[] };

function pick(href: string): NavItem {
  const found = nav.find((i) => i.href === href);
  if (!found) throw new Error(`Unknown nav item: ${href}`);
  return found;
}

/**
 * Grouped so the sidebar reads as three short lists instead of one long one,
 * and fits a laptop screen without scrolling. Support is deliberately absent —
 * it lives in the corner bubble (see SupportBubble).
 */
function buildNavSections(showTrades: boolean, showOwner: boolean): NavSection[] {
  const home: NavItem[] = [pick("/dashboard")];
  if (showOwner) home.push(ownerItem);

  const prospect: NavItem[] = [pick("/dashboard/search"), pick("/dashboard/leads")];
  if (showTrades) prospect.push(tradesItem);

  return [
    { items: home },
    { label: "Prospect", items: prospect },
    {
      label: "Get paid",
      items: [pick("/dashboard/invoice-templates"), pick("/dashboard/payments")],
    },
    { label: "Account", items: [pick("/dashboard/plan")] },
  ];
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
  sections,
}: {
  pathname: string;
  onNavigate?: () => void;
  sections: NavSection[];
}) {
  return (
    <nav className="px-2.5 py-3" aria-label="Dashboard">
      {sections.map((section, i) => (
        <div key={section.label ?? `section-${i}`} className={i > 0 ? "mt-4" : ""}>
          {section.label ? (
            <p className="px-2.5 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.13em] text-slate-400 dark:text-slate-500">
              {section.label}
            </p>
          ) : null}
          <div className="space-y-0.5">
            {section.items.map((item) => {
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
                  aria-current={active ? "page" : undefined}
                  className={
                    // Dropping the 36px icon well for a plain 18px glyph is what
                    // buys back the vertical space the menu was overflowing by.
                    "group relative flex min-h-[40px] items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors touch-manipulation " +
                    (active
                      ? "bg-indigo-50 font-semibold text-indigo-900 dark:bg-indigo-500/15 dark:text-indigo-100"
                      : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100")
                  }
                >
                  {active ? (
                    <span
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-500"
                      aria-hidden
                    />
                  ) : null}
                  <Icon
                    className={
                      "h-[18px] w-[18px] shrink-0 transition-colors " +
                      (active
                        ? "text-indigo-600 dark:text-indigo-300"
                        : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300")
                    }
                  />
                  <span className="min-w-0 truncate">{item.label}</span>
                  {isOwner && (
                    <span className="ml-auto rounded bg-amber-100 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                      owner
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function BrandBlock({ small }: { small?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="group flex w-max max-w-full items-center gap-2 overflow-visible transition hover:opacity-90 touch-manipulation"
    >
      <Image
        src="/favicon.svg"
        alt="LocalLeadster"
        className={
          "shrink-0 rounded-xl shadow-md shadow-indigo-500/20 " + (small ? "h-8 w-8" : "h-9 w-9")
        }
        width={small ? 32 : 36}
        height={small ? 32 : 36}
        priority
      />
      <span className="min-w-0 shrink-0 overflow-visible">
        <span
          className={
            BRAND_WORDMARK_NAV +
            (small ? " text-[15px]" : " text-[15px] md:text-base")
          }
        >
          LocalLeadster
        </span>
        {!small && (
          <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Pipeline
          </span>
        )}
      </span>
    </Link>
  );
}

function initialsOf(user: { email: string; name?: string | null }): string {
  const source = user.name?.trim() || user.email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]).join("");
  return (letters || source[0] || "?").toUpperCase();
}

/**
 * Compact account block. The theme toggle used to own a full row of its own;
 * as an icon button beside the name it costs nothing.
 */
function FooterHome({
  user,
}: {
  user?: { email: string; name?: string | null; isPro: boolean };
}) {
  return (
    <div className="shrink-0 border-t border-slate-200/80 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] dark:border-slate-800/80">
      {user ? (
        <>
          <div className="flex items-center gap-2.5 px-1.5 py-1.5">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200"
            >
              {initialsOf(user)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold leading-tight text-slate-900 dark:text-slate-50">
                {user.name || user.email}
              </span>
              <span
                className={
                  "block text-[0.65rem] font-bold uppercase tracking-wider " +
                  (user.isPro
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-500 dark:text-slate-400")
                }
              >
                {user.isPro ? "Pro" : "Free plan"}
              </span>
            </span>
            {/* Labelled pill: a bare switch here gave no clue what it toggled. */}
            <ThemeToggle hideCaption compact className="shrink-0" />
          </div>

          <div className="mt-1.5">
            {!user.isPro ? (
              <UpgradeButton className="w-full" label="Upgrade to Pro" />
            ) : (
              <ManageBillingButton className="w-full" label="Manage billing" />
            )}
          </div>
        </>
      ) : null}

      <Link
        href="/sign-out"
        prefetch={false}
        className="group mt-1 flex min-h-[38px] w-full items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
      >
        <svg
          className="h-[18px] w-[18px] shrink-0 text-slate-400 dark:text-slate-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9l3 3-3 3m3-3H8.25" />
        </svg>
        Sign out
      </Link>
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
  const navSections = buildNavSections(Boolean(user?.showTrades), Boolean(user?.showOwner));

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
              <NavList pathname={pathname} onNavigate={close} sections={navSections} />
            </div>
            <FooterHome user={user} />
          </aside>
        </div>
      )}

      <aside className="hidden h-screen min-h-0 w-64 min-w-0 border-r border-slate-200/80 bg-gradient-to-b from-slate-50 to-white shadow-[4px_0_32px_-8px_rgba(15,23,42,0.12)] dark:border-slate-800/80 dark:from-slate-950 dark:to-slate-900 dark:shadow-[4px_0_32px_-8px_rgba(0,0,0,0.45)] lg:sticky lg:top-0 lg:flex lg:flex-col">
        <div className="border-b border-slate-200/80 px-4 py-4 dark:border-slate-800/80">
          <BrandBlock />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavList pathname={pathname} sections={navSections} />
        </div>
        <FooterHome user={user} />
      </aside>
    </div>
  );
}
