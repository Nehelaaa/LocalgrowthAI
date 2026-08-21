"use client";

import { Suspense, type ReactNode } from "react";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";

export function PostHogRoot({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <PostHogProvider>{children}</PostHogProvider>
    </Suspense>
  );
}
