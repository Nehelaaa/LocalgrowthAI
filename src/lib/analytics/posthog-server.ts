/**
 * Server-side PostHog capture. No-ops when NEXT_PUBLIC_POSTHOG_KEY is unset.
 * Never throws — analytics must not break product flows.
 */
import { PostHog } from "posthog-node";

let client: PostHog | null | undefined;

function getServerPostHog(): PostHog | null {
  if (client !== undefined) return client;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) {
    client = null;
    return null;
  }
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
  try {
    client = new PostHog(key, {
      host,
      flushAt: 1,
      flushInterval: 0,
    });
  } catch {
    client = null;
  }
  return client;
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    const ph = getServerPostHog();
    if (!ph) return;
    ph.capture({
      distinctId: distinctId || "anonymous",
      event,
      properties: {
        ...properties,
        $lib: "localleadster-server",
      },
    });
    await ph.flush();
  } catch {
    // never block the request
  }
}
