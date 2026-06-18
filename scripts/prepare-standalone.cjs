const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const standaloneDir = path.join(root, ".next", "standalone");
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(standaloneDir, "public");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Missing source directory: ${src}`);
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

if (!fs.existsSync(path.join(standaloneDir, "server.js"))) {
  console.error("[standalone] Run `next build` with output: 'standalone' first.");
  process.exit(1);
}

copyDir(staticSrc, staticDest);
copyDir(publicSrc, publicDest);
console.log("[standalone] Copied static assets and public/ into .next/standalone");
