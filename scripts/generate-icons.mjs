import { cp, mkdir, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import toIco from 'to-ico'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = join(__dirname, '..')
const faviconDir = join(rootDir, 'favicon')
const publicDir = join(rootDir, 'src', 'renderer', 'public')
const resourcesDir = join(rootDir, 'resources')

await mkdir(publicDir, { recursive: true })
await mkdir(resourcesDir, { recursive: true })

const faviconFiles = await readdir(faviconDir)
for (const file of faviconFiles) {
  await cp(join(faviconDir, file), join(publicDir, file), { force: true })
}

const iconPngPath = join(resourcesDir, 'icon.png')
await cp(join(faviconDir, 'ms-icon-310x310.png'), iconPngPath, { force: true })

const iconSizes = [16, 24, 32, 48, 64, 128, 256]
const iconBuffers = await Promise.all(
  iconSizes.map((size) => sharp(iconPngPath).resize(size, size).png().toBuffer())
)
const iconIco = await toIco(iconBuffers)
await writeFile(join(resourcesDir, 'icon.ico'), iconIco)

console.log('Synced icon assets from favicon/ and built resources/icon.ico')
