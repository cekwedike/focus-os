import type Database from 'better-sqlite3'
import { resolveDefaultTimezone } from '@shared/constants/timezones'

export function applyTimezoneLegacyFixMigration(db: Database.Database): void {
  const row = db
    .prepare('SELECT value FROM app_settings WHERE key = ?')
    .get('timezone') as { value: string } | undefined

  if (!row) {
    return
  }

  const timezone = JSON.parse(row.value) as string
  if (timezone !== 'UTC') {
    return
  }

  db.prepare('UPDATE app_settings SET value = ?, updated_at = ? WHERE key = ?').run(
    JSON.stringify(resolveDefaultTimezone()),
    new Date().toISOString(),
    'timezone'
  )
}
