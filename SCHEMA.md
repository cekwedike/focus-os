# Database Schema

Focus OS uses a single SQLite database file (`focus-os.db`) managed by better-sqlite3 in the Electron main process. All table and column names use **snake_case**. Primary keys are integer `id` unless noted. Timestamps are ISO 8601 text in UTC (`TEXT`) or Unix milliseconds (`INTEGER`); this schema uses **TEXT ISO 8601** for readability and query consistency.

Foreign keys are enforced: `PRAGMA foreign_keys = ON`.

## Entity Relationship Overview

```
clients_projects ──┬──< tasks
                   ├──< daily_schedule (client_id nullable for non-client blocks)
                   └──< check_ins_log

protected_blocks (template/config, not per-day instances)

daily_settings (one row per calendar date)
daily_schedule (many rows per date, materialized blocks)

breaks_log ──> optional client_id, schedule block reference
faith_log (standalone per date)
insights_log (standalone per date)
app_settings (key-value global config)
```

## Tables

### 1. `clients_projects`

Dynamic clients and projects created by the user. A single table treats "client" and "project" as the same entity kind; UI may label either term.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `name` | TEXT | NOT NULL | Display name |
| `color` | TEXT | NOT NULL | Hex color, e.g. `#3B82F6` |
| `weight_percent` | REAL | NOT NULL DEFAULT 0 | Share of flexible time (0-100); active clients should sum to 100 or engine normalizes |
| `is_active` | INTEGER | NOT NULL DEFAULT 1 | Boolean 0/1 |
| `fixed_block_enabled` | INTEGER | NOT NULL DEFAULT 0 | Boolean: use daily fixed window |
| `fixed_block_start` | TEXT | NULL | `HH:MM` local time, if fixed block enabled |
| `fixed_block_duration_minutes` | INTEGER | NULL | Duration of fixed daily window |
| `reminder_enabled` | INTEGER | NOT NULL DEFAULT 0 | Boolean: recurring check-in during client's fixed-block window |
| `reminder_interval_minutes` | INTEGER | NULL | Countdown interval between acknowledgments when enabled |
| `reminder_label` | TEXT | NULL | Custom reminder text; defaults to "Check in" at due time if empty |
| `last_touched_at` | TEXT | NULL | ISO 8601; updated when user works a block or completes task |
| `staleness_threshold_hours` | INTEGER | NULL | Override global default; NULL uses app setting |
| `sort_order` | INTEGER | NOT NULL DEFAULT 0 | Sidebar/matrix ordering |
| `created_at` | TEXT | NOT NULL | |
| `updated_at` | TEXT | NOT NULL | |

**Indexes**

- `idx_clients_projects_active` ON (`is_active`, `sort_order`)
- `idx_clients_projects_last_touched` ON (`last_touched_at`) WHERE `is_active = 1`

**System client convention**

Migration 005 seeds a hidden row named `__unassigned__` with `weight_percent = 0`. Task Matrix quick-add assigns tasks here when no client is detected. The allocation engine excludes zero-weight clients from weighted distribution. Settings UI hides this row from the client list.

**Reminder eligibility**

Recurring check-ins require `reminder_enabled`, `fixed_block_enabled`, and a valid start/duration. Flexible-only clients with reminders enabled are ignored until a fixed window is configured.

### 1b. `check_ins_log`

Acknowledged client check-ins during fixed-block windows.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `client_project_id` | INTEGER | NOT NULL, FK → clients_projects.id | |
| `check_in_date` | TEXT | NOT NULL | `YYYY-MM-DD` of the fixed-block window's schedule date |
| `scheduled_at` | TEXT | NOT NULL | ISO 8601 when the countdown reached zero (became due) |
| `acknowledged_at` | TEXT | NOT NULL | ISO 8601 when user clicked Done |
| `actual_interval_minutes` | INTEGER | NULL | Minutes since previous acknowledgment today; NULL for first check-in of the day |
| `created_at` | TEXT | NOT NULL | |

**`actual_interval_minutes` notes**

Computed as `round((acknowledged_at - previous_ack.acknowledged_at) / 60_000)` for the same client and `check_in_date`. Can exceed `reminder_interval_minutes` when the user acknowledges late (overdue). NULL when there is no prior acknowledgment that day.

**Indexes**

- `idx_check_ins_log_client_date` ON (`client_project_id`, `check_in_date`, `acknowledged_at`)

### 2. `tasks`

Central task list across all clients.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `client_id` | INTEGER | NOT NULL, FK → clients_projects.id | |
| `title` | TEXT | NOT NULL | |
| `description` | TEXT | NULL | |
| `priority` | INTEGER | NOT NULL DEFAULT 3 | 1 = highest, 5 = lowest |
| `deadline_date` | TEXT | NULL | `YYYY-MM-DD` local calendar date |
| `estimated_minutes` | INTEGER | NULL | Hint for allocation |
| `status` | TEXT | NOT NULL DEFAULT 'pending' | `pending`, `in_progress`, `completed`, `cancelled`, `deferred` |
| `deferred_to_date` | TEXT | NULL | Set when bumped to next day by engine |
| `completed_at` | TEXT | NULL | ISO 8601 |
| `created_at` | TEXT | NOT NULL | |
| `updated_at` | TEXT | NOT NULL | |

**Indexes**

- `idx_tasks_client_status` ON (`client_id`, `status`)
- `idx_tasks_schedule_fill` ON (`status`, `priority`, `deadline_date`) WHERE `status` IN ('pending', 'in_progress')
- `idx_tasks_deferred` ON (`deferred_to_date`)

### 3. `protected_blocks`

User-configurable templates for non-negotiable daily blocks. Not dated rows; engine instantiates these onto `daily_schedule` each generation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `block_type` | TEXT | NOT NULL | See enum below |
| `label` | TEXT | NOT NULL | User-facing name |
| `duration_minutes` | INTEGER | NOT NULL | |
| `anchor_type` | TEXT | NOT NULL | `wake_offset`, `fixed_time`, `relative` |
| `anchor_value` | TEXT | NOT NULL | Minutes after wake, or `HH:MM`, or relative rule encoded as JSON/text |
| `sort_order` | INTEGER | NOT NULL DEFAULT 0 | Placement order among protected blocks |
| `is_enabled` | INTEGER | NOT NULL DEFAULT 1 | Boolean 0/1 |
| `skippable` | INTEGER | NOT NULL DEFAULT 0 | Boolean: whether daily instances of this template can be skipped from Live Execution or chat |
| `created_at` | TEXT | NOT NULL | |
| `updated_at` | TEXT | NOT NULL | |

**`skippable` defaults by `block_type`**

| `block_type` | Default | Reasoning |
|--------------|---------|-----------|
| `meal` | 1 (true) | Personal nourishment is flexible |
| `micro_break` | 1 (true) | Optional scheduled slot; popups handle most breaks |
| `morning_routine` | 0 (false) | Foundational start-of-day habit |
| `faith` | 0 (false) | Intentional practice; completion uses journal path |
| `winddown` | 0 (false) | End-of-day boundary before sleep target |

Client blocks (`fixed_client`, `weighted_client`) on `daily_schedule` are always skippable at runtime. `buffer` and `break` rows are never skippable.

**`block_type` enum**

| Value | Description |
|-------|-------------|
| `morning_routine` | Morning routine after wake |
| `faith` | Bible reading and prayer |
| `meal` | Breakfast, lunch, dinner instances (multiple rows allowed) |
| `micro_break` | Scheduled micro-break slots (distinct from popup log) |
| `winddown` | End-of-day wind-down before sleep target |

**Indexes**

- `idx_protected_blocks_enabled_order` ON (`is_enabled`, `sort_order`)

### 4. `daily_schedule`

Materialized schedule blocks for a specific calendar date. Regenerated or partially updated on wake time, long break re-allocation, or manual regen.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `schedule_date` | TEXT | NOT NULL | `YYYY-MM-DD` |
| `block_type` | TEXT | NOT NULL | `protected`, `fixed_client`, `weighted_client`, `buffer`, `break` |
| `protected_subtype` | TEXT | NULL | Matches protected_blocks.block_type when applicable |
| `client_id` | INTEGER | NULL, FK → clients_projects.id | NULL for pure protected/buffer rows |
| `task_id` | INTEGER | NULL, FK → tasks.id | Primary task assigned to block |
| `title` | TEXT | NOT NULL | Display label |
| `planned_start` | TEXT | NOT NULL | ISO 8601 local |
| `planned_end` | TEXT | NOT NULL | ISO 8601 local |
| `planned_duration_minutes` | INTEGER | NOT NULL | |
| `actual_start` | TEXT | NULL | Filled when user starts block |
| `actual_end` | TEXT | NULL | Filled on completion or skip |
| `actual_duration_minutes` | INTEGER | NULL | |
| `status` | TEXT | NOT NULL DEFAULT 'planned' | See status enum below |
| `priority_order` | INTEGER | NOT NULL DEFAULT 0 | Sort key within day |
| `metadata_json` | TEXT | NULL | Extra engine output (compression ratio, bumped tasks refs) |
| `created_at` | TEXT | NOT NULL | |
| `updated_at` | TEXT | NOT NULL | |

**`status` enum (daily_schedule)**

| Value | Description |
|-------|-------------|
| `planned` | Generated but not started (user-facing "pending") |
| `active` | Currently running (at most one per day) |
| `completed` | Finished manually, by faith journal, or auto-progression at `planned_end` |
| `skipped` | User skipped; unused time reclaimed by shifting later blocks earlier |
| `compressed` | Shortened by long-break re-allocation |
| `superseded` | Replaced on schedule regen or reallocate |

**Extend and skip behavior**

- **Extend +5:** Adds 5 minutes to active block `planned_end` and shifts all later blocks later by 5 minutes (flat cascade). Day may end later than the original sleep target; no silent compression.
- **Skip:** Sets `skipped`, `actual_end = now`, shifts later blocks earlier by unused minutes. Next `planned` block becomes `active`.
- `idx_daily_schedule_date_client` ON (`schedule_date`, `client_id`)
- `idx_daily_schedule_active` ON (`schedule_date`, `status`) WHERE `status` = 'active'

**Notes**

- Re-allocation marks future client blocks `superseded` and inserts new rows rather than silent overwrite (preserves audit for Review screen).
- `compressed` indicates block shortened by long-break re-allocation.

### 5. `breaks_log`

Log of micro-break popups and long breaks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `break_date` | TEXT | NOT NULL | `YYYY-MM-DD` |
| `break_type` | TEXT | NOT NULL | `micro` or `long` |
| `started_at` | TEXT | NOT NULL | ISO 8601 |
| `ended_at` | TEXT | NULL | ISO 8601; NULL if ongoing |
| `duration_minutes` | INTEGER | NULL | Planned or actual |
| `reason` | TEXT | NULL | Long break reason; micro may use activity label |
| `activity` | TEXT | NULL | Micro-break choice: `read`, `walk`, `call`, `messages`, `doomscroll`, etc. |
| `client_id` | INTEGER | NULL, FK → clients_projects.id | Optional context |
| `schedule_block_id` | INTEGER | NULL, FK → daily_schedule.id | Block interrupted |
| `created_at` | TEXT | NOT NULL | |

**`break_type` enum**

| Value | Description |
|-------|-------------|
| `micro` | ~90 minute popup break |
| `long` | User-initiated extended break |

**Indexes**

- `idx_breaks_log_date_type` ON (`break_date`, `break_type`)
- `idx_breaks_log_started` ON (`started_at`)

### 6. `faith_log`

Daily Bible reading and prayer journal entries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `entry_date` | TEXT | NOT NULL UNIQUE | `YYYY-MM-DD` one entry per day |
| `bible_reference` | TEXT | NULL | e.g. `Psalm 23`, `Romans 8:1-11` |
| `prayer_notes` | TEXT | NULL | Free text |
| `word_count` | INTEGER | NOT NULL DEFAULT 0 | Computed on save |
| `created_at` | TEXT | NOT NULL | |
| `updated_at` | TEXT | NOT NULL | |

**Indexes**

- `idx_faith_log_entry_date` ON (`entry_date`) UNIQUE (also enforced by UNIQUE constraint)
- Full-text search optional later: `fts_faith_log` virtual table on `prayer_notes`, `bible_reference`

**Streak computation**

Derived at query time from consecutive `entry_date` rows with non-empty `prayer_notes` or `bible_reference` per app rules (document in Journal module).

### 7. `daily_settings`

Per-day settings captured at day start or when user changes day parameters.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `settings_date` | TEXT | NOT NULL UNIQUE | `YYYY-MM-DD` |
| `wake_time` | TEXT | NULL | ISO 8601 or `HH:MM` on that date |
| `sleep_target_time` | TEXT | NULL | Optional upper bound for schedule |
| `buffer_percent` | REAL | NOT NULL DEFAULT 10 | Percent of remaining day reserved as buffer blocks |
| `remaining_minutes_at_wake` | INTEGER | NULL | Snapshot after wake entry |
| `allocation_version` | INTEGER | NOT NULL DEFAULT 1 | Increment on each full regen |
| `notes` | TEXT | NULL | User day notes |
| `created_at` | TEXT | NOT NULL | |
| `updated_at` | TEXT | NOT NULL | |

**Indexes**

- `idx_daily_settings_date` ON (`settings_date`) UNIQUE

### 8. `insights_log`

Stored Daily Insight outputs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, AUTOINCREMENT | |
| `insight_date` | TEXT | NOT NULL | `YYYY-MM-DD` |
| `source` | TEXT | NOT NULL | `openrouter`, `ollama`, or `none` |
| `model` | TEXT | NULL | Model id used |
| `prompt_snapshot_json` | TEXT | NULL | Redacted snapshot sent (for debug) |
| `content_markdown` | TEXT | NOT NULL | Rendered insight body |
| `generation_ms` | INTEGER | NULL | Latency |
| `error_message` | TEXT | NULL | If fallback or failure |
| `created_at` | TEXT | NOT NULL | |

**`source` enum**

| Value | Description |
|-------|-------------|
| `openrouter` | Online OpenRouter API |
| `ollama` | Local Ollama instance |
| `none` | AI unavailable; template or cached message |

**Indexes**

- `idx_insights_log_date` ON (`insight_date`, `created_at` DESC)

Multiple insights per day allowed (regenerate); UI shows latest by default.

### 9. `app_settings`

Global key-value configuration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | TEXT | PK | Setting identifier |
| `value` | TEXT | NOT NULL | JSON-encoded value |
| `updated_at` | TEXT | NOT NULL | |

**Standard keys (examples)**

| Key | Value shape | Description |
|-----|-------------|-------------|
| `openrouter_model` | string | Model id (API key from env, not stored here ideally) |
| `ollama_endpoint` | string | Default `http://localhost:11434` |
| `ollama_model` | string | Local model name |
| `default_staleness_hours` | number | Default 24 |
| `micro_break_interval_minutes` | number | Default 90 |
| `min_viable_block_minutes` | number | Default 15 |
| `notifications` | object | Per-category booleans |
| `theme_accent` | string | Default `#2DD4A0` |
| `onboarding_complete` | boolean | First-run flag |
| `user_display_name` | string | Optional display name for chat greetings |
| `sidebar_expanded` | boolean | Desktop nav rail expanded state (default true) |
| `launch_at_login` | boolean | Register with Windows login (default false, opt-in) |
| `tray_close_tip_shown` | boolean | One-time tray close explanation shown |

**Security note**

Prefer `OPENROUTER_API_KEY` from environment at runtime. If stored locally, use OS credential store or encrypted file; never commit. See [SECURITY.md](./SECURITY.md).

## Migration Strategy

1. Table `schema_migrations` (`version INTEGER PRIMARY KEY`, `applied_at TEXT`).
2. Sequential files: `001_initial.sql`, `002_...sql`.
3. App startup runs pending migrations before accepting IPC.

## Seed Data

On first run:

- Default `protected_blocks` rows (morning_routine, faith, meals, winddown) with sensible durations disabled/enabled per product defaults.
- Default `app_settings` keys listed above.

No seed clients or tasks (user-created only).

## Query Patterns

| Feature | Primary tables |
|---------|----------------|
| Task Matrix | `tasks` JOIN `clients_projects` |
| Schedule timeline | `daily_schedule` WHERE `schedule_date` |
| Review planned vs actual | `daily_schedule` aggregated by `client_id`, `breaks_log` |
| Journal streak | `faith_log` consecutive dates |
| Daily Insight input | `daily_schedule`, `tasks`, `faith_log`, `clients_projects`, prior day schedule |

## Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ALLOCATION_ENGINE.md](./ALLOCATION_ENGINE.md)
