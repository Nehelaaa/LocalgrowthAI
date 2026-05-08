/**
 * Vercel / CI: `prisma migrate deploy` must use a direct Postgres connection (Neon host without `-pooler`).
 * Pooled DATABASE_URL alone often causes P1002 (advisory lock timeout) through PgBouncer.
 *
 * This script requires DIRECT_URL, then runs migrate with DATABASE_URL forced to that value for the subprocess
 * so the migration engine always uses a lock-friendly connection.
 *
 * Neon compute can be suspended when idle — the first TCP connect often fails with Prisma P1001 until it wakes.
 * We retry a few times with a short delay so Vercel builds survive cold starts.
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

const MIGRATE_MAX_ATTEMPTS = Math.min(
  10,
  Math.max(1, Number(process.env.PRISMA_MIGRATE_MAX_ATTEMPTS ?? "5"))
);
const MIGRATE_RETRY_DELAY_MS = Math.min(
  60_000,
  Math.max(0, Number(process.env.PRISMA_MIGRATE_RETRY_DELAY_MS ?? "4500"))
);

function sleepMs(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* busy-wait: short windows; keeps script sync without shell sleep */
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

if (pooled === direct) {
  console.warn(
    "[migrate] DATABASE_URL and DIRECT_URL are the same string. Use Neon’s pooled connection for DATABASE_URL (host contains “-pooler”) and the direct connection for DIRECT_URL (no “-pooler”) so serverless + migrations stay healthy."
  );
}

const env = { ...process.env, DATABASE_URL: direct };
let lastStatus = 1;

for (let attempt = 1; attempt <= MIGRATE_MAX_ATTEMPTS; attempt++) {
  if (attempt > 1 && MIGRATE_RETRY_DELAY_MS > 0) {
    console.warn(
      `[migrate] retry ${attempt}/${MIGRATE_MAX_ATTEMPTS} after ${MIGRATE_RETRY_DELAY_MS}ms (Neon wake / transient P1001)`
    );
    sleepMs(MIGRATE_RETRY_DELAY_MS);
  } else if (attempt === 1) {
    console.warn(
      `[migrate] prisma migrate deploy (${MIGRATE_MAX_ATTEMPTS} attempt(s) max, direct host)`
    );
  }

  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  });

  lastStatus = result.status === null ? 1 : result.status;
  if (lastStatus === 0) {
    process.exit(0);
  }
}

console.error(
  "\n[migrate] Still failing after retries. P1001 usually means the build cannot reach Postgres.\n" +
    "  • Neon: open dashboard → project → ensure branch is not deleted; resume compute if suspended.\n" +
    "  • Vercel: Settings → Env — set DATABASE_URL (pooled) + DIRECT_URL (direct), both with ?sslmode=require\n" +
    "  • Neon IP allowlist: allow Vercel or disable allowlist for serverless CI.\n" +
    "  • Optional env: PRISMA_MIGRATE_MAX_ATTEMPTS=8 PRISMA_MIGRATE_RETRY_DELAY_MS=8000\n"
);
process.exit(lastStatus);
