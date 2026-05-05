/**
 * Windows dev machines sometimes hit EPERM when renaming the Prisma query engine DLL
 * (another process holds the file). Retry a few times before failing the build.
 */
const { existsSync } = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const clientIndex = path.join(__dirname, "../node_modules/.prisma/client/index.js");

const attempts = Number(process.env.PRISMA_GENERATE_RETRIES ?? "4");
const delayMs = Number(process.env.PRISMA_GENERATE_RETRY_DELAY_MS ?? "800");

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* spin */
  }
}

let lastStatus = 1;
for (let i = 0; i < attempts; i++) {
  const r = spawnSync("npx", ["prisma", "generate"], {
    stdio: ["inherit", "pipe", "pipe"],
    shell: process.platform === "win32",
    encoding: "utf-8",
  });
  const stdout = r.stdout ?? "";
  const stderr = r.stderr ?? "";
  process.stdout.write(stdout);
  process.stderr.write(stderr);

  lastStatus = r.status === null ? 1 : r.status;
  if (lastStatus === 0) process.exit(0);

  const combined = stdout + stderr + String(r.error ?? "");
  const isEperm =
    combined.includes("EPERM") ||
    combined.includes("operation not permitted") ||
    r.error?.code === "EPERM";
  if (!isEperm || i === attempts - 1) break;
  console.warn(
    `[prisma generate] attempt ${i + 1}/${attempts} failed (EPERM?). Retrying in ${delayMs}ms…`
  );
  sleep(delayMs);
}

if (lastStatus !== 0 && existsSync(clientIndex)) {
  console.warn(
    "[prisma generate] still failing but an existing Prisma client was found — continuing the build. Stop `next dev` / close editors locking the DLL, then run `npx prisma generate` if types drift."
  );
  process.exit(0);
}

process.exit(lastStatus);
