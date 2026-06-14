export const INITIAL_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS clients_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  weight_percent REAL NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  fixed_block_enabled INTEGER NOT NULL DEFAULT 0,
  fixed_block_start TEXT,
  fixed_block_duration_minutes INTEGER,
  last_touched_at TEXT,
  staleness_threshold_hours INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_projects_active ON clients_projects (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_clients_projects_last_touched ON clients_projects (last_touched_at) WHERE is_active = 1;

CREATE TABLE IF NOT EXISTS protected_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  block_type TEXT NOT NULL,
  label TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  anchor_type TEXT NOT NULL,
  anchor_value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_protected_blocks_enabled_order ON protected_blocks (is_enabled, sort_order);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 3,
  deadline_date TEXT,
  estimated_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  deferred_to_date TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients_projects (id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_client_status ON tasks (client_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_schedule_fill ON tasks (status, priority, deadline_date)
  WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_tasks_deferred ON tasks (deferred_to_date);

CREATE TABLE IF NOT EXISTS daily_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  settings_date TEXT NOT NULL UNIQUE,
  wake_time TEXT,
  sleep_target_time TEXT,
  buffer_percent REAL NOT NULL DEFAULT 10,
  remaining_minutes_at_wake INTEGER,
  allocation_version INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_settings_date ON daily_settings (settings_date);

CREATE TABLE IF NOT EXISTS faith_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date TEXT NOT NULL UNIQUE,
  bible_reference TEXT,
  prayer_notes TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_faith_log_entry_date ON faith_log (entry_date);

CREATE TABLE IF NOT EXISTS insights_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  insight_date TEXT NOT NULL,
  source TEXT NOT NULL,
  model TEXT,
  prompt_snapshot_json TEXT,
  content_markdown TEXT NOT NULL,
  generation_ms INTEGER,
  error_message TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_insights_log_date ON insights_log (insight_date, created_at DESC);

CREATE TABLE IF NOT EXISTS daily_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_date TEXT NOT NULL,
  block_type TEXT NOT NULL,
  protected_subtype TEXT,
  client_id INTEGER,
  task_id INTEGER,
  title TEXT NOT NULL,
  planned_start TEXT NOT NULL,
  planned_end TEXT NOT NULL,
  planned_duration_minutes INTEGER NOT NULL,
  actual_start TEXT,
  actual_end TEXT,
  actual_duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'planned',
  priority_order INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients_projects (id),
  FOREIGN KEY (task_id) REFERENCES tasks (id)
);

CREATE INDEX IF NOT EXISTS idx_daily_schedule_date_order ON daily_schedule (schedule_date, priority_order);
CREATE INDEX IF NOT EXISTS idx_daily_schedule_date_client ON daily_schedule (schedule_date, client_id);
CREATE INDEX IF NOT EXISTS idx_daily_schedule_active ON daily_schedule (schedule_date, status)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS breaks_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  break_date TEXT NOT NULL,
  break_type TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_minutes INTEGER,
  reason TEXT,
  activity TEXT,
  client_id INTEGER,
  schedule_block_id INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients_projects (id),
  FOREIGN KEY (schedule_block_id) REFERENCES daily_schedule (id)
);

CREATE INDEX IF NOT EXISTS idx_breaks_log_date_type ON breaks_log (break_date, break_type);
CREATE INDEX IF NOT EXISTS idx_breaks_log_started ON breaks_log (started_at);
`
