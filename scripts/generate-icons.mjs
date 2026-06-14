import { cp, mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

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

await cp(join(faviconDir, 'favicon.ico'), join(resourcesDir, 'icon.ico'), { force: true })
await cp(join(faviconDir, 'ms-icon-310x310.png'), join(resourcesDir, 'icon.png'), { force: true })

console.log('Synced icon assets from favicon/')
