#!/usr/bin/env node
/**
 * Generates PWA icons from src/app/icon.svg using sharp.
 *
 * Usage:
 *   node scripts/generate-icons.mjs
 *
 * After running, commit the generated PNGs and optionally remove sharp:
 *   npm uninstall sharp
 */

import { readFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const svgPath = resolve(root, "src/app/icon.svg");
const iconsDir = resolve(root, "public/icons");

const svg = await readFile(svgPath);
await mkdir(iconsDir, { recursive: true });

// Standard icons
for (const size of [192, 512]) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(resolve(iconsDir, `icon-${size}x${size}.png`));
  console.log(`✓ icon-${size}x${size}.png`);
}

// Maskable icon (20% safe-zone padding filled with background color)
const maskableSize = 512;
const padding = Math.round(maskableSize * 0.1); // 10% each side = 20% total
const innerSize = maskableSize - padding * 2;

const innerIcon = await sharp(svg).resize(innerSize, innerSize).png().toBuffer();

await sharp({
  create: {
    width: maskableSize,
    height: maskableSize,
    channels: 4,
    background: { r: 9, g: 9, b: 11, alpha: 1 }, // #09090b
  },
})
  .composite([{ input: innerIcon, left: padding, top: padding }])
  .png()
  .toFile(resolve(iconsDir, `icon-maskable-${maskableSize}x${maskableSize}.png`));
console.log(`✓ icon-maskable-${maskableSize}x${maskableSize}.png`);

// Apple touch icon (180x180)
await sharp(svg)
  .resize(180, 180)
  .png()
  .toFile(resolve(root, "public/apple-touch-icon.png"));
console.log("✓ apple-touch-icon.png");

console.log("\nDone! Icons generated in public/icons/ and public/apple-touch-icon.png");
