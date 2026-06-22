import type Database from 'better-sqlite3'

export function applyGoogleIntegrationsMigration(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS external_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      account_email TEXT NOT NULL,
      scopes TEXT NOT NULL,
      token_key_ref TEXT NOT NULL,
      calendar_ids_json TEXT,
      gmail_enabled INTEGER NOT NULL DEFAULT 1,
      calendar_enabled INTEGER NOT NULL DEFAULT 1,
      last_sync_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_external_accounts_provider_email
      ON external_accounts (provider, account_email);

    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT NOT NULL,
      account_id INTEGER NOT NULL,
      calendar_id TEXT NOT NULL,
      title TEXT NOT NULL,
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      is_all_day INTEGER NOT NULL DEFAULT 0,
      attendees_json TEXT,
      location TEXT,
      synced_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES external_accounts (id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_events_external
      ON calendar_events (account_id, external_id);

    CREATE INDEX IF NOT EXISTS idx_calendar_events_range
      ON calendar_events (start_at, end_at);

    CREATE TABLE IF NOT EXISTS email_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT NOT NULL,
      account_id INTEGER NOT NULL,
      thread_id TEXT,
      subject TEXT NOT NULL,
      from_address TEXT NOT NULL,
      received_at TEXT NOT NULL,
      snippet TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      is_actionable INTEGER,
      triage_summary TEXT,
      suggested_client_id INTEGER,
      suggested_priority INTEGER,
      suggested_deadline TEXT,
      linked_task_id INTEGER,
      synced_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES external_accounts (id) ON DELETE CASCADE,
      FOREIGN KEY (linked_task_id) REFERENCES tasks (id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_email_messages_external
      ON email_messages (account_id, external_id);

    CREATE INDEX IF NOT EXISTS idx_email_messages_actionable
      ON email_messages (is_actionable, linked_task_id)
      WHERE is_actionable = 1 AND linked_task_id IS NULL;
  `)
}
