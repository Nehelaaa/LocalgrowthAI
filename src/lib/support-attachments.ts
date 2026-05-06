/** Limits for /dashboard/support uploads (aligned with Resend attachment model). */

export const SUPPORT_MAX_ATTACHMENTS = 3;
export const SUPPORT_MAX_TOTAL_ATTACHMENT_BYTES = 8 * 1024 * 1024;
export const SUPPORT_MAX_SINGLE_FILE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
]);

const ALLOWED_EXT = new Set(["pdf", "png", "jpg", "jpeg", "webp", "gif", "txt"]);

export function supportAttachmentMimeLabel(): string {
  return "PDF, PNG, JPG, WebP, GIF, or TXT";
}

export function isAllowedSupportFile(mime: string, filename: string): boolean {
  const m = mime.toLowerCase().split(";")[0]?.trim() ?? "";
  if (m && ALLOWED_MIME.has(m)) return true;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_EXT.has(ext);
}

export function sanitizeSupportFilename(raw: string): string {
  const base = raw
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.replace(/[^a-zA-Z0-9._\- ()]+/g, "_")
    .trim()
    .slice(0, 120);
  return base && base.length > 0 ? base : "attachment";
}
