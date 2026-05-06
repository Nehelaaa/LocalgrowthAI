/**
 * Tailwind class strings for the gradient “LocalLeadster” wordmark.
 * `bg-clip-text` + flex `min-w-0` can clip the last letter; `inline-block`, end padding,
 * and slight bottom padding keep the full word visible.
 */

/** Auth cards + marketing mobile header (text-lg, violet → blue). */
export const BRAND_WORDMARK_LG =
  "inline-block whitespace-nowrap bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 bg-clip-text pb-[0.12em] pe-1 text-lg font-bold leading-snug tracking-normal text-transparent dark:from-violet-300 dark:via-indigo-300 dark:to-sky-300";

/** Dashboard sidebar / compact header (sizes applied separately). */
export const BRAND_WORDMARK_NAV =
  "inline-block whitespace-nowrap bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text pb-[0.12em] pe-0.5 font-bold leading-snug tracking-normal text-transparent dark:from-violet-300 dark:to-indigo-300";
