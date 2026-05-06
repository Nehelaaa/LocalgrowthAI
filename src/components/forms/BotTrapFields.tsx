"use client";

import { BOT_HONEYPOT_FIELD } from "@/lib/form-bot-guard";

/** Invisible honeypot for native form posts — do not remove. */
export function BotTrapFields() {
  return (
    <div
      className="pointer-events-none fixed -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
      aria-hidden
    >
      <input
        name={BOT_HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}
