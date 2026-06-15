import type Database from 'better-sqlite3'

export function applyChatAiLogMigration(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_ai_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_message TEXT NOT NULL,
      response_mode TEXT NOT NULL,
      classified_intent TEXT,
      source TEXT NOT NULL,
      model TEXT,
      action_taken TEXT NOT NULL,
      generation_ms INTEGER,
      error_message TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_chat_ai_log_created
      ON chat_ai_log (created_at DESC);
  `)
}
