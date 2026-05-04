import type { ContactStatus } from "@prisma/client";

export const CONTACT_STATUS_ORDER: ContactStatus[] = [
  "NOT_CONTACTED",
  "CONTACTED",
  "INTERESTED",
  "CLOSED_WON",
  "CLOSED_LOST",
];

/** CRM list: lower = closer to top — active pipeline before cold / closed. */
export function contactStatusListPriority(status: ContactStatus): number {
  switch (status) {
    case "INTERESTED":
      return 0;
    case "CONTACTED":
      return 1;
    case "NOT_CONTACTED":
      return 2;
    case "CLOSED_WON":
      return 3;
    case "CLOSED_LOST":
      return 4;
  }
}

export const contactStatusLabel: Record<ContactStatus, string> = {
  NOT_CONTACTED: "Not Contacted",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

/**
 * Pills: soft fills only (no ring/border) so they never read as a harsh “black frame”.
 * Slightly more saturation than the previous *-100 so status reads at a glance.
 */
export const contactStatusPillClass: Record<ContactStatus, string> = {
  NOT_CONTACTED:
    "bg-slate-100/95 text-slate-800 dark:bg-slate-800/90 dark:text-slate-200",
  CONTACTED:
    "bg-sky-100/90 text-sky-900 dark:bg-sky-950/70 dark:text-sky-200",
  INTERESTED:
    "bg-amber-100/90 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  CLOSED_WON:
    "bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
  CLOSED_LOST: "bg-rose-100/90 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200",
};

/** Small list marker dot in menus — same hues as the pills */
export const contactStatusDotClass: Record<ContactStatus, string> = {
  NOT_CONTACTED: "bg-slate-500 dark:bg-slate-400",
  CONTACTED: "bg-sky-500 dark:bg-sky-400",
  INTERESTED: "bg-amber-500 dark:bg-amber-400",
  CLOSED_WON: "bg-emerald-500 dark:bg-emerald-400",
  CLOSED_LOST: "bg-rose-500 dark:bg-rose-400",
};
