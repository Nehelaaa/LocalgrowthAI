/**
 * Writes Stripe-friendly PNGs of public/icon.svg and public/logo.svg to the user Desktop.
 * Stripe (Brand elements): min 128×128, max 512KB, PNG or JPG — see tooltip in Dashboard.
 * Writes both Localleadster-* and Localgrowth-* filenames so older Desktop files are replaced.
 * Run: node scripts/export-stripe-branding-pngs.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const desktop = join(homedir(), "Desktop");
const publicDir = join(process.cwd(), "public");
const STRIPE_MAX_BYTES = 512 * 1024;

/** Logo.svg viewBox width / height (keep in sync with public/logo.svg). */
const LOGO_ASPECT_W = 1240;
const LOGO_ASPECT_H = 360;

async function rasterizeLogoUnderStripeCap(logoSvg) {
  /** Short edge = 512px → well above 128px min, still usually under 512KB for flat vectors. */
  let shortSide = 512;
  while (shortSide >= 128) {
    const h = shortSide;
    const w = Math.max(128, Math.round((shortSide * LOGO_ASPECT_W) / LOGO_ASPECT_H));
    const buf = await sharp(logoSvg)
      .resize(w, h)
      .png({ compressionLevel: 9, effort: 10 })
      .toBuffer();
    if (buf.length <= STRIPE_MAX_BYTES) {
      return { buf, w, h, bytes: buf.length };
    }
    shortSide -= 48;
  }
  /** Fallback: JPEG if PNG cannot get under cap (Stripe allows JPG). */
  const h = 256;
  const w = Math.max(128, Math.round((h * LOGO_ASPECT_W) / LOGO_ASPECT_H));
  const buf = await sharp(logoSvg).resize(w, h).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  return { buf, w, h, bytes: buf.length, jpeg: true };
}

async function main() {
  const iconSvg = readFileSync(join(publicDir, "icon.svg"));
  const logoSvg = readFileSync(join(publicDir, "logo.svg"));

  // Icon: square, ≥128 (512 is crisp on retina and stays under 512KB for this artwork).
  const iconPng = await sharp(iconSvg).resize(512, 512).png({ compressionLevel: 9, effort: 10 }).toBuffer();
  if (iconPng.length > STRIPE_MAX_BYTES) {
    console.warn(
      `[export-stripe-branding] Icon PNG is ${iconPng.length} bytes (Stripe max ${STRIPE_MAX_BYTES}); consider simplifying SVG.`,
    );
  }

  const logo = await rasterizeLogoUnderStripeCap(logoSvg);
  const logoExt = logo.jpeg ? ".jpg" : ".png";
  const logoPaths = [
    join(desktop, `Localleadster-Stripe-logo${logoExt}`),
    join(desktop, `Localgrowth-Stripe-logo${logoExt}`),
  ];

  const iconPaths = [
    join(desktop, "Localleadster-Stripe-icon.png"),
    join(desktop, "Localgrowth-Stripe-icon.png"),
  ];

  for (const p of iconPaths) writeFileSync(p, iconPng);
  for (const p of logoPaths) writeFileSync(p, logo.buf);

  console.log(
    `Icon: 512×512 PNG (${iconPng.length} bytes) — meets Stripe ≥128×128, must be ≤512KB.`,
  );
  console.log(
    `Logo: ${logo.w}×${logo.h} ${logo.jpeg ? "JPEG" : "PNG"} (${logo.bytes} bytes) — min side ≥128, ≤512KB.`,
  );
  console.log("Wrote:\n  ", iconPaths.join("\n  "));
  console.log("  ", logoPaths.join("\n  "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
