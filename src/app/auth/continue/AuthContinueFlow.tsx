"use client";

import { useEffect, useRef } from "react";
import { getSession } from "next-auth/react";
import { getPostLoginDestination } from "@/actions/post-login-destination";
import { AuthTransitionScreen } from "@/components/auth/AuthTransitionScreen";

const SESSION_POLL_MS = 120;
const SESSION_MAX_ATTEMPTS = 30;

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export function AuthContinueFlow({ next }: { next: string }) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    void (async () => {
      for (let attempt = 0; attempt < SESSION_MAX_ATTEMPTS; attempt++) {
        if (cancelled) return;
        try {
          const session = await getSession();
          if (session?.user) {
            const dest = await getPostLoginDestination(next);
            if (cancelled) return;
            window.location.replace(dest);
            return;
          }
        } catch {
          /* retry */
        }
        await sleep(SESSION_POLL_MS);
      }

      if (!cancelled) {
        window.location.replace(
          `/login?callbackUrl=${encodeURIComponent(next)}`
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [next]);

  return <AuthTransitionScreen />;
}
