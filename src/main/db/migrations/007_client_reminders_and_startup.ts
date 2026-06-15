import type Database from 'better-sqlite3'

const STARTUP_SETTINGS = [
  { key: 'sidebar_expanded', value: JSON.stringify(true) },
  { key: 'launch_at_login', value: JSON.stringify(false) },
  { key: 'tray_close_tip_shown', value: JSON.stringify(false) },
] as const

export function applyClientRemindersAndStartupMigration(db: Database.Database): void {
  const columns = db.prepare(`PRAGMA table_info(clients_projects)`).all() as Array<{ name: string }>
  const columnNames = new Set(columns.map((column) => column.name))

  if (!columnNames.has('reminder_enabled')) {
    db.exec(`
      ALTER TABLE clients_projects ADD COLUMN reminder_enabled INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE clients_projects ADD COLUMN reminder_interval_minutes INTEGER;
      ALTER TABLE clients_projects ADD COLUMN reminder_label TEXT;
    `)
  }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value, updated_at)
    VALUES (@key, @value, @updated_at)
  `)

  const updatedAt = new Date().toISOString()
  for (const setting of STARTUP_SETTINGS) {
    insert.run({
      key: setting.key,
      value: setting.value,
      updated_at: updatedAt,
    })
  }
}
