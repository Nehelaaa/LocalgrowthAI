/**
 * Writes Stripe-friendly PNGs of public/icon.svg, public/logo.svg, and public/logo-stripe-portal.svg to:
 *   - the user Desktop (Localgrowth-/Localleadster-Stripe-*.png|jpg)
 *   - public/ (same names, for uploads / backups)
 *
 * Stripe (Brand elements): min 128×128, max 512KB, PNG or JPG — see tooltip in Dashboard.
 * You only get one "Logo" upload: use the horizontal *-logo* for wide Checkout; use *-logo-portal*
 * for a taller stacked lockup if the Customer Portal sidebar looked too small.
 *
 * Run: node scripts/export-stripe-branding-pngs.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const desktop = join(homedir(), "Desktop");
const publicDir = join(process.cwd(), "public");
const STRIPE_MAX_BYTES = 512 * 1024;

/** public/logo.svg viewBox width / height (keep in sync). */
const LOGO_ASPECT_W = 1240;
const LOGO_ASPECT_H = 360;

/** public/logo-stripe-portal.svg viewBox (stacked mark + wordmark). */
const PORTAL_ASPECT_W = 420;
const PORTAL_ASPECT_H = 380;

/**
 * Resize by height; width derived from aspect. Steps down until PNG ≤ Stripe cap, else JPEG.
 */
async function rasterizeWideLogoUnderStripeCap(logoSvg, aspectW, aspectH) {
  let shortSide = 512;
  while (shortSide >= 128) {
    const h = shortSide;
    const w = Math.max(128, Math.round((shortSide * aspectW) / aspectH));
    const buf = await sharp(logoSvg)
      .resize(w, h)
      .png({ compressionLevel: 9, effort: 10 })
      .toBuffer();
    if (buf.length <= STRIPE_MAX_BYTES) {
      return { buf, w, h, bytes: buf.length };
    }
    shortSide -= 48;
  }
  const h = 256;
  const w = Math.max(128, Math.round((h * aspectW) / aspectH));
  const buf = await sharp(logoSvg).resize(w, h).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  return { buf, w, h, bytes: buf.length, jpeg: true };
}

async function main() {
  const iconSvg = readFileSync(join(publicDir, "icon.svg"));
  const logoSvg = readFileSync(join(publicDir, "logo.svg"));
  const portalSvg = readFileSync(join(publicDir, "logo-stripe-portal.svg"));

  // Icon: square, ≥128 (512 is crisp on retina and stays under 512KB for this artwork).
  const iconPng = await sharp(iconSvg).resize(512, 512).png({ compressionLevel: 9, effort: 10 }).toBuffer();
  if (iconPng.length > STRIPE_MAX_BYTES) {
    console.warn(
      `[export-stripe-branding] Icon PNG is ${iconPng.length} bytes (Stripe max ${STRIPE_MAX_BYTES}); consider simplifying SVG.`,
    );
  }

  const logo = await rasterizeWideLogoUnderStripeCap(logoSvg, LOGO_ASPECT_W, LOGO_ASPECT_H);
  const portal = await rasterizeWideLogoUnderStripeCap(portalSvg, PORTAL_ASPECT_W, PORTAL_ASPECT_H);

  const logoExt = logo.jpeg ? ".jpg" : ".png";
  const portalExt = portal.jpeg ? ".jpg" : ".png";

  const logoPaths = [
    join(desktop, `Localleadster-Stripe-logo${logoExt}`),
    join(desktop, `Localgrowth-Stripe-logo${logoExt}`),
  ];
  const portalPaths = [
    join(desktop, `Localleadster-Stripe-logo-portal${portalExt}`),
    join(desktop, `Localgrowth-Stripe-logo-portal${portalExt}`),
  ];

  const iconPaths = [
    join(desktop, "Localleadster-Stripe-icon.png"),
    join(desktop, "Localgrowth-Stripe-icon.png"),
  ];

  const publicLogoPaths = [
    join(publicDir, `Localleadster-Stripe-logo${logoExt}`),
    join(publicDir, `Localgrowth-Stripe-logo${logoExt}`),
  ];
  const publicPortalPaths = [
    join(publicDir, `Localleadster-Stripe-logo-portal${portalExt}`),
    join(publicDir, `Localgrowth-Stripe-logo-portal${portalExt}`),
  ];
  const publicIconPaths = [
    join(publicDir, "Localleadster-Stripe-icon.png"),
    join(publicDir, "Localgrowth-Stripe-icon.png"),
  ];

  for (const p of iconPaths) writeFileSync(p, iconPng);
  for (const p of logoPaths) writeFileSync(p, logo.buf);
  for (const p of portalPaths) writeFileSync(p, portal.buf);
  for (const p of publicIconPaths) writeFileSync(p, iconPng);
  for (const p of publicLogoPaths) writeFileSync(p, logo.buf);
  for (const p of publicPortalPaths) writeFileSync(p, portal.buf);

  console.log(
    `Icon: 512×512 PNG (${iconPng.length} bytes) — meets Stripe ≥128×128, must be ≤512KB.`,
  );
  console.log(
    `Logo (horizontal): ${logo.w}×${logo.h} ${logo.jpeg ? "JPEG" : "PNG"} (${logo.bytes} bytes).`,
  );
  console.log(
    `Logo (portal stacked): ${portal.w}×${portal.h} ${portal.jpeg ? "JPEG" : "PNG"} (${portal.bytes} bytes) — upload this as Stripe Logo if the portal header looked tiny.`,
  );
  console.log("Desktop:\n  ", iconPaths.join("\n  "));
  console.log("  ", logoPaths.join("\n  "));
  console.log("  ", portalPaths.join("\n  "));
  console.log("public/:\n  ", publicIconPaths.join("\n  "));
  console.log("  ", publicLogoPaths.join("\n  "));
  console.log("  ", publicPortalPaths.join("\n  "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
