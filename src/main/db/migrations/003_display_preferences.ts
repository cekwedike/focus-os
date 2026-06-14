import type Database from 'better-sqlite3'

const DISPLAY_PREFERENCE_SEEDS = [
  { key: 'time_format', value: JSON.stringify('12h') },
  { key: 'week_starts_on', value: JSON.stringify('sunday') },
  { key: 'date_format', value: JSON.stringify('mdy') },
  { key: 'default_sleep_time', value: JSON.stringify('23:00') },
] as const

export function applyDisplayPreferencesMigration(db: Database.Database): void {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value, updated_at)
    VALUES (@key, @value, @updated_at)
  `)

  const timestamp = new Date().toISOString()
  const apply = db.transaction(() => {
    for (const row of DISPLAY_PREFERENCE_SEEDS) {
      insert.run({ ...row, updated_at: timestamp })
    }
  })

  apply()
}
