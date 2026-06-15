import { config } from 'dotenv'
import { existsSync } from 'fs'
import { join } from 'path'

const ENV_CANDIDATE_PATHS = [
  join(process.cwd(), '.env'),
  join(__dirname, '../../../.env'),
  join(__dirname, '../../../../.env'),
]

for (const envPath of ENV_CANDIDATE_PATHS) {
  if (existsSync(envPath)) {
    config({ path: envPath, override: false })
    break
  }
}
