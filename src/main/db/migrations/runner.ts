import type Database from 'better-sqlite3'
import { INITIAL_MIGRATION_SQL } from './001_initial'
import { applySettingsKeysMigration } from './002_settings_keys'
import { applyDisplayPreferencesMigration } from './003_display_preferences'
import { applyTimezoneMigration } from './004_timezone'
import { applyUnassignedClientMigration } from './005_unassigned_client'
import { applyUserDisplayNameMigration } from './006_user_display_name'
import { applyClientRemindersAndStartupMigration } from './007_client_reminders_and_startup'
import { applyCheckInsLogMigration } from './008_check_ins_log'
import { applyProtectedBlocksSkippableMigration } from './009_protected_blocks_skippable'
import { applyNotificationsLogMigration } from './010_notifications_log'
import { applyScheduleTimestampNormalizationMigration } from './011_schedule_timestamp_normalization'
import { applyChatAiLogMigration } from './012_chat_ai_log'
import { applyOpenRouterFreeModelsMigration } from './013_openrouter_free_models'
import { applyVoiceSettingsMigration } from './014_voice_settings'
import { applyTimezoneLegacyFixMigration } from './015_timezone_legacy_fix'
import { applyMaxBufferMinutesMigration } from './016_max_buffer_minutes'
import { applyTaskEisenhowerMigration } from './017_task_eisenhower'
import { applyGoogleIntegrationsMigration } from './018_google_integrations'
import { applyAssistantBriefingsMigration } from './019_assistant_briefings'
import { seedInitialData } from './seed'

export interface MigrationDefinition {
  version: number
  name: string
  up: (db: Database.Database) => void
}

const migrations: MigrationDefinition[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: (db) => {
      db.exec(INITIAL_MIGRATION_SQL)
      seedInitialData(db)
    },
  },
  {
    version: 2,
    name: 'settings_keys',
    up: (db) => {
      applySettingsKeysMigration(db)
    },
  },
  {
    version: 3,
    name: 'display_preferences',
    up: (db) => {
      applyDisplayPreferencesMigration(db)
    },
  },
  {
    version: 4,
    name: 'timezone',
    up: (db) => {
      applyTimezoneMigration(db)
    },
  },
  {
    version: 5,
    name: 'unassigned_client',
    up: (db) => {
      applyUnassignedClientMigration(db)
    },
  },
  {
    version: 6,
    name: 'user_display_name',
    up: (db) => {
      applyUserDisplayNameMigration(db)
    },
  },
  {
    version: 7,
    name: 'client_reminders_and_startup',
    up: (db) => {
      applyClientRemindersAndStartupMigration(db)
    },
  },
  {
    version: 8,
    name: 'check_ins_log',
    up: (db) => {
      applyCheckInsLogMigration(db)
    },
  },
  {
    version: 9,
    name: 'protected_blocks_skippable',
    up: (db) => {
      applyProtectedBlocksSkippableMigration(db)
    },
  },
  {
    version: 10,
    name: 'notifications_log',
    up: (db) => {
      applyNotificationsLogMigration(db)
    },
  },
  {
    version: 11,
    name: 'schedule_timestamp_normalization',
    up: (db) => {
      applyScheduleTimestampNormalizationMigration(db)
    },
  },
  {
    version: 12,
    name: 'chat_ai_log',
    up: (db) => {
      applyChatAiLogMigration(db)
    },
  },
  {
    version: 13,
    name: 'openrouter_free_models',
    up: (db) => {
      applyOpenRouterFreeModelsMigration(db)
    },
  },
  {
    version: 14,
    name: 'voice_settings',
    up: (db) => {
      applyVoiceSettingsMigration(db)
    },
  },
  {
    version: 15,
    name: 'timezone_legacy_fix',
    up: (db) => {
      applyTimezoneLegacyFixMigration(db)
    },
  },
  {
    version: 16,
    name: 'max_buffer_minutes',
    up: (db) => {
      applyMaxBufferMinutesMigration(db)
    },
  },
  {
    version: 17,
    name: 'task_eisenhower',
    up: (db) => {
      applyTaskEisenhowerMigration(db)
    },
  },
  {
    version: 18,
    name: 'google_integrations',
    up: (db) => {
      applyGoogleIntegrationsMigration(db)
    },
  },
  {
    version: 19,
    name: 'assistant_briefings',
    up: (db) => {
      applyAssistantBriefingsMigration(db)
    },
  },
]

function ensureMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `)
}

function getAppliedVersions(db: Database.Database): Set<number> {
  const rows = db.prepare('SELECT version FROM schema_migrations ORDER BY version ASC').all() as Array<{
    version: number
  }>
  return new Set(rows.map((row) => row.version))
}

export function runMigrations(db: Database.Database): number {
  ensureMigrationsTable(db)
  const applied = getAppliedVersions(db)
  const insertMigration = db.prepare(`
    INSERT INTO schema_migrations (version, name, applied_at)
    VALUES (@version, @name, @applied_at)
  `)

  let latestVersion = 0

  const applyPending = db.transaction(() => {
    for (const migration of migrations) {
      if (applied.has(migration.version)) {
        latestVersion = Math.max(latestVersion, migration.version)
        continue
      }

      migration.up(db)
      insertMigration.run({
        version: migration.version,
        name: migration.name,
        applied_at: new Date().toISOString(),
      })
      latestVersion = migration.version
    }
  })

  applyPending()
  return latestVersion
}

export function getLatestSchemaVersion(db: Database.Database): number {
  ensureMigrationsTable(db)
  const row = db
    .prepare('SELECT MAX(version) AS version FROM schema_migrations')
    .get() as { version: number | null }
  return row.version ?? 0
}

export function listUserTableNames(db: Database.Database): string[] {
  const rows = db
    .prepare(
      `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name ASC
    `
    )
    .all() as Array<{ name: string }>

  return rows.map((row) => row.name)
}
