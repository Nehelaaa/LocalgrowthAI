/** Default customer-support inbox (override with SUPPORT_INBOX_EMAIL in env). */
export const SUPPORT_INBOX_EMAIL = "localleadster@gmail.com";

export function supportMailtoHref(): string {
  return `mailto:${SUPPORT_INBOX_EMAIL}?subject=${encodeURIComponent("LocalLeadster support")}`;
}
