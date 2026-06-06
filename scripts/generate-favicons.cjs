/**
 * Rasterize public/favicon.svg into PNG/ICO assets for Safari and legacy browsers.
 * Run: node scripts/generate-favicons.cjs
 */
const { readFileSync, writeFileSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");
const sharp = require("sharp");

const root = join(__dirname, "..");
const svgPath = join(root, "public", "favicon.svg");
const svg = readFileSync(svgPath);

async function png(size) {
  return sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
}

async function main() {
  const sizes = [16, 32, 180, 192, 512];
  const buffers = {};
  for (const s of sizes) {
    buffers[s] = await png(s);
  }

  const publicDir = join(root, "public");
  const appDir = join(root, "src", "app");

  writeFileSync(join(publicDir, "favicon-16x16.png"), buffers[16]);
  writeFileSync(join(publicDir, "favicon-32x32.png"), buffers[32]);
  writeFileSync(join(publicDir, "apple-touch-icon.png"), buffers[180]);
  writeFileSync(join(publicDir, "icon-192.png"), buffers[192]);
  writeFileSync(join(publicDir, "icon-512.png"), buffers[512]);

  writeFileSync(join(appDir, "icon.png"), buffers[32]);
  writeFileSync(join(appDir, "apple-icon.png"), buffers[180]);

  let ico;
  try {
    const toIco = require("to-ico");
    ico = await toIco([buffers[16], buffers[32]]);
  } catch {
    console.warn("[generate-favicons] to-ico not installed; writing 32px PNG as public/favicon.ico fallback is skipped.");
    ico = null;
  }
  if (ico) {
    writeFileSync(join(publicDir, "favicon.ico"), ico);
    writeFileSync(join(appDir, "favicon.ico"), ico);
  }

  console.log("Favicon PNG/ICO assets written to public/ and src/app/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
