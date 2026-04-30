/**
 * Parse JSON from a fetch Response. Empty or non-JSON bodies (e.g. HTML from a redirect) return null.
 */
export async function readResponseJson<T>(r: Response): Promise<T | null> {
  const text = await r.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
