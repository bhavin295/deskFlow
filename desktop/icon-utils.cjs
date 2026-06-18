const path = require("node:path");
const fs = require("node:fs");
const { nativeImage } = require("electron");

const BRAND_ICON_PNG = "deskflow-logo.png";

function getBrandIconPngPath() {
  const publicPng = path.join(__dirname, "..", "public", BRAND_ICON_PNG);
  if (fs.existsSync(publicPng)) return publicPng;

  const desktopPng = path.join(__dirname, "icon.png");
  if (fs.existsSync(desktopPng)) return desktopPng;

  return null;
}

/** @returns {import('electron').NativeImage} */
function loadBrandNativeImage(size = 512) {
  const pngPath = getBrandIconPngPath();
  if (!pngPath) return nativeImage.createEmpty();

  const image = nativeImage.createFromPath(pngPath);
  if (image.isEmpty()) return nativeImage.createEmpty();

  const { width, height } = image.getSize();
  if (width === size && height === size) return image;
  return image.resize({ width: size, height: size });
}

module.exports = {
  BRAND_ICON_PNG,
  BRAND_ICON_WEB_PATH: `/${BRAND_ICON_PNG}`,
  getBrandIconPngPath,
  loadBrandNativeImage,
};
