import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = join(__dirname, '..')
const installerDir = join(rootDir, 'resources', 'installer')

const COLORS = {
  surface: { r: 5, g: 8, b: 16 },
  surfaceCard: { r: 12, g: 18, b: 32 },
  mint: { r: 0, g: 229, b: 168 },
  cyan: { r: 34, g: 211, b: 238 },
  grid: { r: 120, g: 160, b: 220 },
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

function mixColor(from, to, t) {
  return {
    r: lerp(from.r, to.r, t),
    g: lerp(from.g, to.g, t),
    b: lerp(from.b, to.b, t),
  }
}

function createBmp(width, height, pixelFn) {
  const rowStride = Math.ceil((width * 3) / 4) * 4
  const pixelDataSize = rowStride * height
  const fileSize = 54 + pixelDataSize
  const buffer = Buffer.alloc(fileSize)

  buffer.write('BM', 0)
  buffer.writeUInt32LE(fileSize, 2)
  buffer.writeUInt32LE(54, 10)

  buffer.writeUInt32LE(40, 14)
  buffer.writeInt32LE(width, 18)
  buffer.writeInt32LE(height, 22)
  buffer.writeUInt16LE(1, 26)
  buffer.writeUInt16LE(24, 28)
  buffer.writeUInt32LE(pixelDataSize, 34)

  for (let y = 0; y < height; y += 1) {
    const bmpY = height - 1 - y
    for (let x = 0; x < width; x += 1) {
      const { r, g, b } = pixelFn(x, y, width, height)
      const offset = 54 + bmpY * rowStride + x * 3
      buffer[offset] = b
      buffer[offset + 1] = g
      buffer[offset + 2] = r
    }
  }

  return buffer
}

function sidebarPixel(x, y, width, height) {
  const vertical = y / Math.max(height - 1, 1)
  let color = mixColor(COLORS.surface, COLORS.surfaceCard, vertical * 0.65)

  if (x < 4) {
    color = mixColor(color, COLORS.mint, 0.55)
  } else if (x < 7) {
    color = mixColor(color, COLORS.cyan, 0.25)
  }

  if (y % 32 < 1) {
    color = mixColor(color, COLORS.grid, 0.08)
  }

  const glowY = height * 0.18
  const glowRadius = height * 0.22
  const dist = Math.abs(y - glowY)
  if (dist < glowRadius) {
    const glow = 1 - dist / glowRadius
    color = mixColor(color, COLORS.mint, glow * 0.12)
  }

  if (x > width - 18 && y > height * 0.55) {
    const band = (y - height * 0.55) / (height * 0.4)
    color = mixColor(color, COLORS.cyan, Math.min(1, band) * 0.08)
  }

  return color
}

function headerPixel(x, y, width, height) {
  const horizontal = x / Math.max(width - 1, 1)
  let color = mixColor(COLORS.surfaceCard, COLORS.surface, horizontal * 0.5)

  if (y >= height - 3) {
    color = mixColor(color, COLORS.mint, 0.75)
  } else if (y >= height - 5) {
    color = mixColor(color, COLORS.cyan, 0.35)
  }

  if (y % 12 < 1) {
    color = mixColor(color, COLORS.grid, 0.06)
  }

  const accentX = width * 0.12
  const accentWidth = width * 0.35
  if (x >= accentX && x <= accentX + accentWidth) {
    color = mixColor(color, COLORS.mint, 0.1)
  }

  return color
}

await mkdir(installerDir, { recursive: true })

const sidebar = createBmp(164, 314, sidebarPixel)
const header = createBmp(150, 57, headerPixel)

await writeFile(join(installerDir, 'sidebar.bmp'), sidebar)
await writeFile(join(installerDir, 'header.bmp'), header)

console.log('Generated NSIS installer assets in resources/installer/')
