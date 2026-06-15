import type Database from 'better-sqlite3'

export function applyNotificationsLogMigration(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      acknowledged_at TEXT,
      urgency TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_log_created
      ON notifications_log (created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_notifications_log_unacknowledged
      ON notifications_log (acknowledged_at)
      WHERE acknowledged_at IS NULL;
  `)
}
