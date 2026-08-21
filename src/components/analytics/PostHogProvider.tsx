"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  captureClientEvent,
  initPostHogClient,
} from "@/lib/analytics/posthog-client";

const LANDING_UTM_KEY = "ll_landing_utm_v1";

function readUtm(searchParams: URLSearchParams) {
  return {
    utm_source: searchParams.get("utm_source") ?? undefined,
    utm_medium: searchParams.get("utm_medium") ?? undefined,
    utm_campaign: searchParams.get("utm_campaign") ?? undefined,
    utm_term: searchParams.get("utm_term") ?? undefined,
    utm_content: searchParams.get("utm_content") ?? undefined,
  };
}

/**
 * Initializes PostHog (when configured) and fires `landing_page_viewed` once per
 * browser session on the first public landing hit, including UTM params.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPostHogClient();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    // Skip authenticated app shell noise for the first-landing event.
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/owner") ||
      pathname.startsWith("/auth")
    ) {
      return;
    }

    try {
      if (sessionStorage.getItem(LANDING_UTM_KEY) === "1") return;
      sessionStorage.setItem(LANDING_UTM_KEY, "1");
    } catch {
      // sessionStorage unavailable — still fire once per mount via this effect
    }

    const utm = readUtm(searchParams);
    captureClientEvent("landing_page_viewed", {
      path: pathname,
      ...utm,
    });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
