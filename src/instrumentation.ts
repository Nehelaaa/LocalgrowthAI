/**
 * Runs early so layout and other modules see the same env as Auth.js.
 * See `src/lib/normalize-env-auth.ts` and `src/lib/clear-auth-url-in-dev.ts`.
 */
import "./lib/normalize-env-auth";
import "./lib/clear-auth-url-in-dev";

export function register() {
  // Side effects are in the import above; hook required for this file to load.
}
