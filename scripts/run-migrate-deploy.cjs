/**
 * Vercel / CI: `prisma migrate deploy` must use a direct Postgres connection (Neon host without `-pooler`).
 * Pooled DATABASE_URL alone often causes P1002 (advisory lock timeout) through PgBouncer.
 *
 * This script requires DIRECT_URL, then runs migrate with DATABASE_URL forced to that value for the subprocess
 * so the migration engine always uses a lock-friendly connection.
 */
const { existsSync } = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const envFile = path.join(__dirname, "../.env");
if (existsSync(envFile)) {
  try {
    require("dotenv").config({ path: envFile });
  } catch {
    /* dotenv optional */
  }
}

const direct = process.env.DIRECT_URL?.trim();
const pooled = process.env.DATABASE_URL?.trim();

if (!pooled) {
  console.error("[migrate] DATABASE_URL is not set.");
  process.exit(1);
}

if (!direct) {
  console.error(
    "[migrate] DIRECT_URL is not set. Add Neon’s “Direct” connection string to Vercel (host must NOT contain “-pooler”).\n" +
      "Without it, prisma migrate deploy hits the pooler and often fails with P1002 (advisory lock timeout)."
  );
  process.exit(1);
}

if (direct.includes("-pooler.")) {
  console.error(
    '[migrate] DIRECT_URL looks like a pooler URL (contains “-pooler.”). Use Neon’s direct hostname instead (Connection details → “Direct”).'
  );
  process.exit(1);
}

const env = { ...process.env, DATABASE_URL: direct };
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

process.exit(result.status === null ? 1 : result.status);
