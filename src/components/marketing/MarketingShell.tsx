"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BRAND_WORDMARK_LG } from "@/lib/brand-wordmark";

export function MarketingShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen min-h-[100dvh] overflow-x-hidden bg-slate-100/90 dark:bg-slate-950">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_50%_-10%,rgba(99,102,241,0.18),transparent)] dark:bg-[radial-gradient(ellipse_100%_50%_at_50%_-10%,rgba(99,102,241,0.1),transparent)]"
        aria-hidden
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-indigo-600 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
          <Link href="/" className="flex min-w-0 items-center gap-2 overflow-visible">
            <Image
              src="/favicon.svg"
              alt="LocalLeadster"
              className="h-9 w-9 shrink-0 rounded-xl shadow-md sm:hidden"
              width={36}
              height={36}
              priority
            />
            <Image
              src="/logo.svg"
              alt="LocalLeadster"
              className="hidden h-10 w-auto max-w-[min(280px,58vw)] rounded-lg sm:block"
              width={240}
              height={70}
              priority
            />
            <span className={`shrink-0 sm:hidden ${BRAND_WORDMARK_LG}`}>LocalLeadster</span>
          </Link>
          <nav
            className="hidden items-center gap-1 text-sm font-medium text-slate-600 sm:flex dark:text-slate-300"
            aria-label="Page sections"
          >
            <Link className="rounded-lg px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" href="/#how-it-works">
              How it works
            </Link>
            <Link className="rounded-lg px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" href="/#features">
              Features
            </Link>
            <Link className="rounded-lg px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" href="/#solutions">
              Solutions
            </Link>
            <Link className="rounded-lg px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" href="/#pricing">
              Pricing
            </Link>
          </nav>
          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-2">
            <div className="w-[min(9.75rem,34vw)] shrink-0 sm:w-[10.5rem]">
              <ThemeToggle hideCaption compact />
            </div>
            <Link
              className="min-h-[40px] shrink-0 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 sm:px-3 dark:text-slate-200"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:from-violet-500 hover:to-indigo-500 sm:px-4"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main id="main">{children}</main>

      <footer
        className="relative z-20 border-t border-slate-200/80 bg-slate-50/90 py-12 text-center text-sm text-slate-500 dark:border-slate-800/80 dark:bg-slate-950/80 dark:text-slate-400"
        role="contentinfo"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="font-medium text-slate-700 dark:text-slate-300">
            © {new Date().getFullYear()} LocalLeadster
          </p>
          <p className="mt-1">Lead generation + pipeline for selling to local businesses.</p>
          <nav className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2" aria-label="Footer">
            <Link href="/login" className="text-indigo-600 hover:underline dark:text-indigo-400">
              Sign in
            </Link>
            <Link href="/register" className="text-indigo-600 hover:underline dark:text-indigo-400">
              Register
            </Link>
            <Link href="/for/freelancers" className="hover:underline">
              Freelancers
            </Link>
            <Link href="/for/agencies" className="hover:underline">
              Agencies
            </Link>
            <Link href="/for/sales" className="hover:underline">
              Sales teams
            </Link>
            <Link href="/for/realtors" className="hover:underline">
              Realtors
            </Link>
            <Link href="/#pricing" className="hover:underline">
              Pricing
            </Link>
            <Link
              href="/contact"
              className="text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
            >
              Contact us
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

