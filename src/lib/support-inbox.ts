/** Default customer-support inbox (override with SUPPORT_INBOX_EMAIL in env). */
const DEFAULT_SUPPORT_INBOX = "support@localleadster.com";

export const SUPPORT_INBOX_EMAIL =
  process.env.SUPPORT_INBOX_EMAIL?.trim() || DEFAULT_SUPPORT_INBOX;

export function supportMailtoHref(): string {
  return `mailto:${SUPPORT_INBOX_EMAIL}?subject=${encodeURIComponent("LocalLeadster support")}`;
}
