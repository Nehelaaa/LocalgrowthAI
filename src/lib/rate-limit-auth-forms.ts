/**
 * Stricter sliding window than general API rate limits — targets scripted sign-ups / resets.
 * In-memory; resets on deploy (same as `@/lib/rate-limit`).
 */

const store = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 12;

export function rateLimitAuthForm(key: string): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true, remaining: MAX_ATTEMPTS - 1 };
  }
  if (now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true, remaining: MAX_ATTEMPTS - 1 };
  }
  entry.count++;
  const remaining = Math.max(0, MAX_ATTEMPTS - entry.count);
  return {
    success: entry.count <= MAX_ATTEMPTS,
    remaining,
  };
}
