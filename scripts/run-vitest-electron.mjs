import { spawnSync } from 'child_process'
import { createRequire } from 'module'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(join(projectRoot, 'package.json'))
const vitestEntry = join(projectRoot, 'node_modules', 'vitest', 'vitest.mjs')

let electronBinary
try {
  electronBinary = require('electron')
} catch {
  console.error('Electron is not installed. Run pnpm install first.')
  process.exit(1)
}

if (!existsSync(vitestEntry)) {
  console.error('Vitest entry not found. Run pnpm install first.')
  process.exit(1)
}

const result = spawnSync(electronBinary, [vitestEntry, 'run', ...process.argv.slice(2)], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
  },
})

process.exit(result.status ?? 1)
