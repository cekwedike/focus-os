/**
 * Procedural NSIS installer artwork for Focus OS.
 * NSIS Modern UI uses 24-bit BMP only (no real animation) — we fake depth with
 * gradients, isometric grids, glowing orbs, and HUD chrome.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import toIco from 'to-ico'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = join(__dirname, '..')
const installerDir = join(rootDir, 'resources', 'installer')

const PALETTE = {
  void: { r: 3, g: 6, b: 12 },
  deep: { r: 6, g: 14, b: 28 },
  panel: { r: 10, g: 20, b: 38 },
  mint: { r: 0, g: 229, b: 168 },
  cyan: { r: 34, g: 211, b: 238 },
  violet: { r: 139, g: 92, b: 246 },
  white: { r: 244, g: 247, b: 251 },
  grid: { r: 80, g: 130, b: 180 },
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function mixColor(from, to, t) {
  return {
    r: Math.round(lerp(from.r, to.r, t)),
    g: Math.round(lerp(from.g, to.g, t)),
    b: Math.round(lerp(from.b, to.b, t)),
  }
}

function colorToRgb(color) {
  return {
    r: clamp(Math.round(color.r), 0, 255),
    g: clamp(Math.round(color.g), 0, 255),
    b: clamp(Math.round(color.b), 0, 255),
  }
}

class Canvas {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.pixels = new Array(width * height)
    for (let index = 0; index < this.pixels.length; index += 1) {
      this.pixels[index] = { r: 0, g: 0, b: 0, a: 0 }
    }
  }

  index(x, y) {
    return y * this.width + x
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height
  }

  get(x, y) {
    return this.pixels[this.index(x, y)]
  }

  plot(x, y, color, alpha = 1) {
    const px = Math.round(x)
    const py = Math.round(y)
    if (!this.inBounds(px, py)) {
      return
    }
    const pixel = this.pixels[this.index(px, py)]
    if (!pixel || !color) {
      return
    }
    const source = colorToRgb(color)
    const blend = clamp(alpha, 0, 1)
    const inverse = 1 - blend
    pixel.r = pixel.r * inverse + source.r * blend
    pixel.g = pixel.g * inverse + source.g * blend
    pixel.b = pixel.b * inverse + source.b * blend
    pixel.a = clamp(pixel.a + blend, 0, 1)
  }

  fill(fn) {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const color = fn(x, y, this.width, this.height)
        this.plot(x, y, color, 1)
      }
    }
  }

  line(x0, y0, x1, y1, color, alpha = 1) {
    let x = x0
    let y = y0
    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy

    while (true) {
      this.plot(x, y, color, alpha)
      if (x === x1 && y === y1) {
        break
      }
      const e2 = err * 2
      if (e2 > -dy) {
        err -= dy
        x += sx
      }
      if (e2 < dx) {
        err += dx
        y += sy
      }
    }
  }

  rect(x, y, width, height, color, alpha = 1) {
    for (let py = y; py < y + height; py += 1) {
      for (let px = x; px < x + width; px += 1) {
        this.plot(px, py, color, alpha)
      }
    }
  }

  glowOrb(cx, cy, radius, core, edge, alpha = 1) {
    const centerX = Math.round(cx)
    const centerY = Math.round(cy)
    const bound = Math.ceil(radius * 1.35)
    for (let y = centerY - bound; y <= centerY + bound; y += 1) {
      for (let x = centerX - bound; x <= centerX + bound; x += 1) {
        const dx = x - centerX
        const dy = y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > radius * 1.35) {
          continue
        }

        const nx = dx / radius
        const ny = dy / radius
        const nz2 = 1 - nx * nx - ny * ny
        if (nz2 > 0) {
          const nz = Math.sqrt(nz2)
          const light = clamp(nx * -0.35 + ny * -0.55 + nz * 0.85, 0, 1)
          const rim = clamp(1 - dist / (radius * 1.2), 0, 1)
          const sphere = mixColor(edge, core, light * 0.85 + rim * 0.15)
          this.plot(x, y, sphere, alpha * clamp(1 - dist / (radius * 1.35), 0, 1))
          continue
        }

        const halo = clamp(1 - (dist - radius * 0.92) / (radius * 0.45), 0, 1)
        this.plot(x, y, core, alpha * halo * 0.35)
      }
    }
  }

  ring(cx, cy, radiusX, radiusY, color, alpha = 0.7, thickness = 1) {
    for (let angle = 0; angle < Math.PI * 2; angle += 0.02) {
      for (let t = 0; t < thickness; t += 1) {
        const x = Math.round(cx + Math.cos(angle) * (radiusX + t))
        const y = Math.round(cy + Math.sin(angle) * (radiusY + t))
        this.plot(x, y, color, alpha)
      }
    }
  }

  toBmp() {
    const rowStride = Math.ceil((this.width * 3) / 4) * 4
    const pixelDataSize = rowStride * this.height
    const fileSize = 54 + pixelDataSize
    const buffer = Buffer.alloc(fileSize)

    buffer.write('BM', 0)
    buffer.writeUInt32LE(fileSize, 2)
    buffer.writeUInt32LE(54, 10)
    buffer.writeUInt32LE(40, 14)
    buffer.writeInt32LE(this.width, 18)
    buffer.writeInt32LE(this.height, 22)
    buffer.writeUInt16LE(1, 26)
    buffer.writeUInt16LE(24, 28)
    buffer.writeUInt32LE(pixelDataSize, 34)

    for (let y = 0; y < this.height; y += 1) {
      const bmpY = this.height - 1 - y
      for (let x = 0; x < this.width; x += 1) {
        const pixel = this.get(x, y)
        const offset = 54 + bmpY * rowStride + x * 3
        buffer[offset] = clamp(Math.round(pixel.b), 0, 255)
        buffer[offset + 1] = clamp(Math.round(pixel.g), 0, 255)
        buffer[offset + 2] = clamp(Math.round(pixel.r), 0, 255)
      }
    }

    return buffer
  }
}

const FONT = {
  F: [
    '11110',
    '10000',
    '11110',
    '10000',
    '10000',
    '10000',
  ],
  O: [
    '01110',
    '10001',
    '10001',
    '10001',
    '10001',
    '01110',
  ],
  C: [
    '01110',
    '10001',
    '10000',
    '10000',
    '10001',
    '01110',
  ],
  U: [
    '10001',
    '10001',
    '10001',
    '10001',
    '10001',
    '01110',
  ],
  S: [
    '01111',
    '10000',
    '01110',
    '00001',
    '00001',
    '11110',
  ],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000'],
}

function drawWord(canvas, text, startX, startY, scale, color, alpha = 1) {
  let cursorX = startX
  for (const char of text) {
    const glyph = FONT[char]
    if (!glyph) {
      cursorX += 6 * scale
      continue
    }
    for (let row = 0; row < glyph.length; row += 1) {
      for (let col = 0; col < glyph[row].length; col += 1) {
        if (glyph[row][col] !== '1') {
          continue
        }
        for (let sy = 0; sy < scale; sy += 1) {
          for (let sx = 0; sx < scale; sx += 1) {
            canvas.plot(cursorX + col * scale + sx, startY + row * scale + sy, color, alpha)
          }
        }
      }
    }
    cursorX += (glyph[0].length + 1) * scale
  }
}

function drawHudBracket(canvas, x, y, size, corner) {
  const color = PALETTE.cyan
  const alpha = 0.75
  if (corner === 'tl') {
    canvas.line(x, y, x + size, y, color, alpha)
    canvas.line(x, y, x, y + size, color, alpha)
  } else if (corner === 'tr') {
    canvas.line(x - size, y, x, y, color, alpha)
    canvas.line(x, y, x, y + size, color, alpha)
  } else if (corner === 'bl') {
    canvas.line(x, y - size, x, y, color, alpha)
    canvas.line(x, y, x + size, y, color, alpha)
  } else if (corner === 'br') {
    canvas.line(x - size, y, x, y, color, alpha)
    canvas.line(x, y - size, x, y, color, alpha)
  }
}

function drawIsometricFloor(canvas, width, height, horizonY) {
  for (let y = horizonY; y < height; y += 1) {
    const depth = (y - horizonY) / Math.max(height - horizonY, 1)
    const base = mixColor(PALETTE.deep, PALETTE.void, depth * 0.55)
    for (let x = 0; x < width; x += 1) {
      canvas.plot(x, y, base, 1)
    }
  }

  for (let row = 0; row < 14; row += 1) {
    const y = horizonY + row * 10
    const alpha = 0.08 + row * 0.012
    canvas.line(0, y, width, y, PALETTE.grid, alpha)
  }

  for (let col = -6; col < 10; col += 1) {
    const x0 = col * 18
    canvas.line(x0, height - 4, width / 2 + col * 8, horizonY, PALETTE.cyan, 0.1)
    canvas.line(width - x0, height - 4, width / 2 - col * 8, horizonY, PALETTE.mint, 0.08)
  }
}

function renderSidebar() {
  const width = 164
  const height = 314
  const canvas = new Canvas(width, height)

  canvas.fill((x, y) => {
    const vertical = y / Math.max(height - 1, 1)
    return mixColor(PALETTE.void, PALETTE.deep, vertical * 0.9)
  })

  drawIsometricFloor(canvas, width, height, 168)

  for (let y = 0; y < height; y += 3) {
    const alpha = y % 6 === 0 ? 0.05 : 0.02
    canvas.line(0, y, width, y, PALETTE.cyan, alpha)
  }

  canvas.glowOrb(82, 78, 34, PALETTE.mint, mixColor(PALETTE.cyan, PALETTE.deep, 0.4), 0.95)
  canvas.ring(82, 82, 48, 14, PALETTE.cyan, 0.45, 1)
  canvas.ring(82, 84, 56, 18, PALETTE.mint, 0.22, 1)

  for (let index = 0; index < 8; index += 1) {
    const angle = index * 0.78
    const x = 82 + Math.cos(angle) * 52
    const y = 84 + Math.sin(angle) * 20
    canvas.glowOrb(x, y, 3, PALETTE.cyan, PALETTE.deep, 0.55)
  }

  drawHudBracket(canvas, 10, 12, 16, 'tl')
  drawHudBracket(canvas, width - 10, 12, 16, 'tr')
  drawHudBracket(canvas, 10, height - 12, 16, 'bl')
  drawHudBracket(canvas, width - 10, height - 12, 16, 'br')

  for (let y = 0; y < height; y += 1) {
    const edge = clamp(1 - y / 28, 0, 1)
    canvas.plot(0, y, PALETTE.mint, edge * 0.9)
    canvas.plot(1, y, PALETTE.cyan, edge * 0.35)
    canvas.plot(2, y, PALETTE.cyan, edge * 0.15)
  }

  drawWord(canvas, 'FOCUS', 24, 132, 2, PALETTE.white, 0.95)
  drawWord(canvas, 'OS', 52, 152, 2, PALETTE.mint, 0.9)

  canvas.rect(18, 178, 44, 2, PALETTE.cyan, 0.7)
  canvas.rect(18, 184, 28, 1, PALETTE.mint, 0.45)

  for (let bar = 0; bar < 5; bar += 1) {
    const barHeight = 6 + (bar % 3) * 5
    canvas.rect(20 + bar * 8, 196 - barHeight, 4, barHeight, PALETTE.cyan, 0.35 + bar * 0.08)
  }

  canvas.rect(14, height - 28, width - 28, 1, PALETTE.mint, 0.55)
  for (let x = 16; x < width - 16; x += 1) {
    const pulse = 0.25 + 0.75 * Math.abs(Math.sin(x * 0.14))
    canvas.plot(x, height - 22, PALETTE.cyan, 0.08 * pulse)
  }

  return canvas.toBmp()
}

function renderHeader() {
  const width = 150
  const height = 57
  const canvas = new Canvas(width, height)

  canvas.fill((x, y, w, h) => {
    const horizontal = x / Math.max(w - 1, 1)
    const vertical = y / Math.max(h - 1, 1)
    let color = mixColor(PALETTE.deep, PALETTE.void, horizontal * 0.35 + vertical * 0.25)
    if (y % 5 === 0) {
      color = mixColor(color, PALETTE.grid, 0.04)
    }
    return color
  })

  for (let x = 0; x < width; x += 12) {
    canvas.line(x, height - 8, x + 24, 8, PALETTE.cyan, 0.05)
  }

  canvas.glowOrb(width - 24, 22, 14, PALETTE.mint, PALETTE.cyan, 0.85)
  canvas.ring(width - 24, 24, 20, 8, PALETTE.cyan, 0.35, 1)

  for (let x = 0; x < width; x += 1) {
    canvas.plot(x, height - 1, PALETTE.mint, 0.95)
    canvas.plot(x, height - 2, PALETTE.cyan, 0.55)
    canvas.plot(x, height - 3, PALETTE.cyan, 0.18)
  }

  canvas.rect(0, 0, width, 2, PALETTE.cyan, 0.25)
  drawHudBracket(canvas, 6, 5, 10, 'tl')
  drawHudBracket(canvas, width - 6, 5, 10, 'tr')

  for (let bar = 0; bar < 6; bar += 1) {
    const barHeight = 4 + ((bar * 3) % 7)
    canvas.rect(10 + bar * 7, 38 - barHeight, 3, barHeight, PALETTE.mint, 0.25)
  }

  return canvas.toBmp()
}

await mkdir(installerDir, { recursive: true })

const iconSource = join(rootDir, 'resources', 'icon.png')
const iconSizes = [16, 24, 32, 48, 64, 128, 256]
const iconBuffers = await Promise.all(
  iconSizes.map((size) => sharp(iconSource).resize(size, size).png().toBuffer())
)
const installerIcon = await toIco(iconBuffers)
await writeFile(join(rootDir, 'resources', 'icon.ico'), installerIcon)

const sidebar = renderSidebar()
const header = renderHeader()

await writeFile(join(installerDir, 'sidebar.bmp'), sidebar)
await writeFile(join(installerDir, 'header.bmp'), header)

console.log('Generated Focus OS NSIS installer artwork in resources/installer/')
console.log('Regenerated resources/icon.ico for NSIS wizard icons')
