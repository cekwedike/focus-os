import { existsSync } from 'fs'
import { join } from 'path'

function iconCandidates(): string[] {
  const preferred = process.platform === 'win32' ? 'icon.ico' : 'icon.png'
  const fallbacks = preferred === 'icon.ico' ? ['icon.png'] : ['icon.ico']

  const fileNames = [preferred, ...fallbacks]
  const roots = [
    join(__dirname, '../../resources'),
    process.resourcesPath,
    join(process.cwd(), 'resources'),
  ]

  const candidates: string[] = []
  for (const root of roots) {
    for (const fileName of fileNames) {
      candidates.push(join(root, fileName))
    }
  }

  return candidates
}

export function resolveAppIconPath(): string | undefined {
  return iconCandidates().find((candidate) => existsSync(candidate))
}
