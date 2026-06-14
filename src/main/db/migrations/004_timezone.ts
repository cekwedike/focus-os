import type Database from 'better-sqlite3'
import { resolveDefaultTimezone } from '@shared/constants/timezones'

export function applyTimezoneMigration(db: Database.Database): void {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value, updated_at)
    VALUES (@key, @value, @updated_at)
  `)

  const timestamp = new Date().toISOString()
  insert.run({
    key: 'timezone',
    value: JSON.stringify(resolveDefaultTimezone()),
    updated_at: timestamp,
  })
}
