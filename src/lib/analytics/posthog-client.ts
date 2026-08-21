"use client";

import posthog from "posthog-js";

let initialized = false;

export function initPostHogClient(): void {
  if (typeof window === "undefined" || initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return;
  try {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
    });
    initialized = true;
  } catch {
    // no-op
  }
}

export function captureClientEvent(
  event: string,
  properties?: Record<string, unknown>
): void {
  try {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()) return;
    initPostHogClient();
    if (!initialized) return;
    posthog.capture(event, properties);
  } catch {
    // no-op
  }
}

export function getPostHogClient() {
  return initialized ? posthog : null;
}
