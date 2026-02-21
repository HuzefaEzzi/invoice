#!/usr/bin/env node
/**
 * Generates PWA icons (192x192 and 512x512) required for installability.
 * Run: node scripts/generate-pwa-icons.mjs
 * Uses public/icon.svg or creates a simple placeholder if missing.
 */
import { createWriteStream } from 'fs'
import { readFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicDir = join(root, 'public')

// Minimal valid PNG (1x1 black pixel) - we'll use sharp if available for real icons
const sizes = [192, 512]

async function main() {
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.error('Run: npm install -D sharp')
    console.error('Then run: node scripts/generate-pwa-icons.mjs')
    process.exit(1)
  }

  const svgPath = join(publicDir, 'icon.svg')
  let input = null
  try {
    const svg = await readFile(svgPath, 'utf-8')
    input = Buffer.from(svg)
  } catch {
    // No icon.svg: create a simple SVG placeholder (dark background + "IM")
    input = Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
        <rect width="512" height="512" fill="#0a0a0a"/>
        <text x="256" y="300" font-family="system-ui,sans-serif" font-size="180" font-weight="700" fill="white" text-anchor="middle">IM</text>
      </svg>
    `)
  }

  for (const size of sizes) {
    const outPath = join(publicDir, `icon-${size}x${size}.png`)
    await sharp(input)
      .resize(size, size)
      .png()
      .toFile(outPath)
    console.log('Created', outPath)
  }
  console.log('PWA icons ready. Redeploy for the install option to appear.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
