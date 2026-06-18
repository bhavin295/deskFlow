#!/usr/bin/env node
/** Build square PNG app icons from deskflow-logo.svg (Electron cannot load SVG for Dock) */
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const sharp = require("sharp");
  const root = path.join(__dirname, "..");
  const svgPath = path.join(root, "public", "deskflow-logo.svg");
  const pngPublic = path.join(root, "public", "deskflow-logo.png");
  const pngDesktop = path.join(root, "desktop", "icon.png");

  const svg = fs.readFileSync(svgPath);
  const png512 = await sharp(svg, { density: 384 })
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  fs.writeFileSync(pngPublic, png512);
  fs.writeFileSync(pngDesktop, png512);
  console.log("[icons] wrote", pngPublic, "and", pngDesktop);
}

main().catch((err) => {
  console.error("[icons] failed:", err);
  process.exit(1);
});
