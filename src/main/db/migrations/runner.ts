import type Database from 'better-sqlite3'
import { INITIAL_MIGRATION_SQL } from './001_initial'
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
