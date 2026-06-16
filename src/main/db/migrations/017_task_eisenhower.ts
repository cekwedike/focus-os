import type Database from 'better-sqlite3'

export function applyTaskEisenhowerMigration(db: Database.Database): void {
  const columns = db.prepare(`PRAGMA table_info(tasks)`).all() as Array<{ name: string }>
  const columnNames = new Set(columns.map((column) => column.name))

  if (!columnNames.has('is_urgent')) {
    db.exec(`ALTER TABLE tasks ADD COLUMN is_urgent INTEGER`)
  }

  if (!columnNames.has('is_important')) {
    db.exec(`ALTER TABLE tasks ADD COLUMN is_important INTEGER`)
  }

  db.prepare(
    `
    UPDATE tasks
    SET
      is_urgent = CASE
        WHEN priority = 1 THEN 1
        WHEN priority = 2 THEN 0
        WHEN priority = 3 THEN 1
        WHEN priority = 4 THEN 0
        ELSE NULL
      END,
      is_important = CASE
        WHEN priority = 1 THEN 1
        WHEN priority = 2 THEN 1
        WHEN priority = 3 THEN 0
        WHEN priority = 4 THEN 0
        ELSE NULL
      END
    WHERE is_urgent IS NULL AND is_important IS NULL
  `
  ).run()
}
