import type Database from 'better-sqlite3'

export function applyCheckInsLogMigration(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS check_ins_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_project_id INTEGER NOT NULL,
      check_in_date TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      acknowledged_at TEXT NOT NULL,
      actual_interval_minutes INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_project_id) REFERENCES clients_projects(id)
    );

    CREATE INDEX IF NOT EXISTS idx_check_ins_log_client_date
      ON check_ins_log (client_project_id, check_in_date, acknowledged_at);
  `)
}
