import type Database from 'better-sqlite3'

const USER_DISPLAY_NAME_SETTING = {
  key: 'user_display_name',
  value: JSON.stringify(''),
} as const

export function applyUserDisplayNameMigration(db: Database.Database): void {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value, updated_at)
    VALUES (@key, @value, @updated_at)
  `)

  insert.run({
    ...USER_DISPLAY_NAME_SETTING,
    updated_at: new Date().toISOString(),
  })
}
