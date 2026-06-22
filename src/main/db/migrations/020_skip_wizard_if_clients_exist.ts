import type Database from 'better-sqlite3'

export function applySkipWizardIfClientsExistMigration(db: Database.Database): void {
  const row = db
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM clients_projects
      WHERE is_active = 1 AND name != '__unassigned__'
    `
    )
    .get() as { count: number }

  if (row.count > 0) {
    db.prepare(
      `
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ('freelancer_wizard_complete', 'true', @updated_at)
      ON CONFLICT(key) DO UPDATE SET value = 'true', updated_at = excluded.updated_at
    `
    ).run({ updated_at: new Date().toISOString() })
  }
}
