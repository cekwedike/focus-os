import type Database from 'better-sqlite3'

const ADDITIONAL_SETTINGS = [
  { key: 'default_buffer_percent', value: JSON.stringify(10) },
  { key: 'doomscroll_allowance_minutes', value: JSON.stringify(5) },
] as const

export function applySettingsKeysMigration(db: Database.Database): void {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value, updated_at)
    VALUES (@key, @value, @updated_at)
  `)

  const timestamp = new Date().toISOString()
  const apply = db.transaction(() => {
    for (const row of ADDITIONAL_SETTINGS) {
      insert.run({ ...row, updated_at: timestamp })
    }
  })

  apply()
}
