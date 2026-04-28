/**
 * Runs early so layout and other modules see the same env as Auth.js.
 * See `src/lib/normalize-env-auth.ts`.
 */
import "./lib/normalize-env-auth";

export function register() {
  // Side effects are in the import above; hook required for this file to load.
}
