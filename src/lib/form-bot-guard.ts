/**
 * Cheap bot mitigation: hidden field humans never see/fill — reject if populated.
 * Field must stay empty string for legitimate submissions (including when omitted).
 */

export const BOT_HONEYPOT_FIELD = "_lgai_hp";

/** @returns true if this looks like an automated submission. */
export function isBotHoneypotTripped(formData: FormData): boolean {
  const v = formData.get(BOT_HONEYPOT_FIELD);
  if (v == null) return false;
  return String(v).trim().length > 0;
}

export function botRejectedUserMessage(): string {
  return "Unable to submit. Please try again.";
}
