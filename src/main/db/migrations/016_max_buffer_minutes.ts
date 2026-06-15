import type Database from 'better-sqlite3'

const MAX_BUFFER_MINUTES_SETTING = {
  key: 'max_buffer_minutes',
  value: JSON.stringify(60),
} as const

export function applyMaxBufferMinutesMigration(db: Database.Database): void {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value, updated_at)
    VALUES (@key, @value, @updated_at)
  `)

  insert.run({
    ...MAX_BUFFER_MINUTES_SETTING,
    updated_at: new Date().toISOString(),
  })
}
