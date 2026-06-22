import type Database from 'better-sqlite3'

export function applyAssistantBriefingsMigration(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS assistant_briefings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      briefing_type TEXT NOT NULL,
      schedule_date TEXT,
      generated_at TEXT NOT NULL,
      content_md TEXT NOT NULL,
      snapshot_json TEXT,
      provider TEXT NOT NULL DEFAULT 'none'
    );

    CREATE INDEX IF NOT EXISTS idx_assistant_briefings_type_date
      ON assistant_briefings (briefing_type, schedule_date, generated_at DESC);
  `)

  const now = new Date().toISOString()
  const assistantDefaults: Array<{ key: string; value: string }> = [
    { key: 'google_sync_interval_minutes', value: '30' },
    {
      key: 'assistant_preferences',
      value: JSON.stringify({
        morningEnabled: true,
        hourlyEnabled: true,
        preMeetingEnabled: true,
        morningHour: 6,
      }),
    },
    {
      key: 'google_integration',
      value: JSON.stringify({
        syncIntervalMinutes: 30,
        calendarIds: ['primary'],
        gmailEnabled: true,
        calendarEnabled: true,
      }),
    },
    { key: 'freelancer_wizard_complete', value: 'false' },
  ]

  const upsert = db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (@key, @value, @updated_at)
    ON CONFLICT(key) DO NOTHING
  `)

  for (const row of assistantDefaults) {
    upsert.run({ ...row, updated_at: now })
  }
}
