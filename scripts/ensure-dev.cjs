/**
 * Stops a leftover Windows `next dev` for this app and clears `.next/dev/lock`
 * if possible. Stops the lock error when a prior dev is still in the background.
 */
const { existsSync } = require("node:fs");
const { join } = require("node:path");
const { execFileSync } = require("node:child_process");

const isWin = process.platform === "win32";
const ps1 = join(__dirname, "ensure-dev.ps1");

if (isWin && existsSync(ps1)) {
  try {
    execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        ps1,
      ],
      { stdio: "ignore" }
    );
  } catch {
    // Still try to start `next dev`; user may have no other instance.
  }
}
