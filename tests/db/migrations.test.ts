import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { closeDatabase, openDatabase } from '../../src/main/db/connection'
import {
  EXPECTED_PROTECTED_BLOCK_TYPES,
  EXPECTED_TABLE_NAMES,
} from '../../src/main/db/migrations/seed'
import { getLatestSchemaVersion, listUserTableNames, runMigrations } from '../../src/main/db/migrations/runner'

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'focus-os-test-'))
  return join(directory, 'focus-os.test.db')
}

describe('database migrations', () => {
  let dbPath = ''

  afterEach(() => {
    closeDatabase()
    if (dbPath) {
      rmSync(join(dbPath, '..'), { recursive: true, force: true })
      dbPath = ''
    }
  })

  it('creates all 9 schema tables plus schema_migrations on a fresh database', () => {
    dbPath = createTempDatabasePath()
    const db = openDatabase(dbPath)
    runMigrations(db)

    const tableNames = listUserTableNames(db)
    for (const tableName of EXPECTED_TABLE_NAMES) {
      expect(tableNames).toContain(tableName)
    }

    expect(getLatestSchemaVersion(db)).toBe(1)
    db.close()
  })

  it('is idempotent when migrations run multiple times', () => {
    dbPath = createTempDatabasePath()
    const db = openDatabase(dbPath)

    runMigrations(db)
    const firstTableNames = listUserTableNames(db)
    const firstProtectedCount = (
      db.prepare('SELECT COUNT(*) AS count FROM protected_blocks').get() as { count: number }
    ).count
    const firstSettingsCount = (
      db.prepare('SELECT COUNT(*) AS count FROM app_settings').get() as { count: number }
    ).count

    runMigrations(db)
    const secondTableNames = listUserTableNames(db)
    const secondProtectedCount = (
      db.prepare('SELECT COUNT(*) AS count FROM protected_blocks').get() as { count: number }
    ).count
    const secondSettingsCount = (
      db.prepare('SELECT COUNT(*) AS count FROM app_settings').get() as { count: number }
    ).count

    expect(secondTableNames).toEqual(firstTableNames)
    expect(secondProtectedCount).toBe(firstProtectedCount)
    expect(secondSettingsCount).toBe(firstSettingsCount)
    expect(getLatestSchemaVersion(db)).toBe(1)

    db.close()
  })

  it('seeds protected_blocks with all 5 expected block types', () => {
    dbPath = createTempDatabasePath()
    const db = openDatabase(dbPath)
    runMigrations(db)

    const rows = db
      .prepare('SELECT DISTINCT block_type AS block_type FROM protected_blocks ORDER BY block_type ASC')
      .all() as Array<{ block_type: string }>

    const seededTypes = rows.map((row) => row.block_type).sort()
    expect(seededTypes).toEqual([...EXPECTED_PROTECTED_BLOCK_TYPES].sort())

    db.close()
  })
})
