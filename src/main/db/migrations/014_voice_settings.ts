import type Database from 'better-sqlite3'

const VOICE_SETTINGS = [
  { key: 'voice_input_enabled', value: JSON.stringify(true) },
  { key: 'voice_output_enabled', value: JSON.stringify(false) },
] as const

export function applyVoiceSettingsMigration(db: Database.Database): void {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value, updated_at)
    VALUES (@key, @value, @updated_at)
  `)

  const timestamp = new Date().toISOString()
  for (const setting of VOICE_SETTINGS) {
    insert.run({
      ...setting,
      updated_at: timestamp,
    })
  }
}
