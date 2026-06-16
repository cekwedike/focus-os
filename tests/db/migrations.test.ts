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
import { applyTimezoneLegacyFixMigration } from '../../src/main/db/migrations/015_timezone_legacy_fix'
import { resolveDefaultTimezone } from '../../src/shared/constants/timezones'

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'focus-os-test-'))
  return join(directory, 'focus-os.test.db')
}

describe('database migrations', () => {
  let dbPath = ''
  let testDb: ReturnType<typeof openDatabase> | null = null

  afterEach(() => {
    if (testDb) {
      testDb.close()
      testDb = null
    }
    closeDatabase()
    if (dbPath) {
      rmSync(join(dbPath, '..'), { recursive: true, force: true })
      dbPath = ''
    }
  })

  it('creates all 11 schema tables plus schema_migrations on a fresh database', () => {
    dbPath = createTempDatabasePath()
    testDb = openDatabase(dbPath)
    runMigrations(testDb)

    const tableNames = listUserTableNames(testDb)
    for (const tableName of EXPECTED_TABLE_NAMES) {
      expect(tableNames).toContain(tableName)
    }

    expect(getLatestSchemaVersion(testDb)).toBe(17)
  })

  it('is idempotent when migrations run multiple times', () => {
    dbPath = createTempDatabasePath()
    testDb = openDatabase(dbPath)

    runMigrations(testDb)
    const firstTableNames = listUserTableNames(testDb)
    const firstProtectedCount = (
      testDb.prepare('SELECT COUNT(*) AS count FROM protected_blocks').get() as { count: number }
    ).count
    const firstSettingsCount = (
      testDb.prepare('SELECT COUNT(*) AS count FROM app_settings').get() as { count: number }
    ).count

    runMigrations(testDb)
    const secondTableNames = listUserTableNames(testDb)
    const secondProtectedCount = (
      testDb.prepare('SELECT COUNT(*) AS count FROM protected_blocks').get() as { count: number }
    ).count
    const secondSettingsCount = (
      testDb.prepare('SELECT COUNT(*) AS count FROM app_settings').get() as { count: number }
    ).count

    expect(secondTableNames).toEqual(firstTableNames)
    expect(secondProtectedCount).toBe(firstProtectedCount)
    expect(secondSettingsCount).toBe(firstSettingsCount)
    expect(getLatestSchemaVersion(testDb)).toBe(17)
  })

  it('seeds protected_blocks with all 5 expected block types', () => {
    dbPath = createTempDatabasePath()
    testDb = openDatabase(dbPath)
    runMigrations(testDb)

    const rows = testDb
      .prepare('SELECT DISTINCT block_type AS block_type FROM protected_blocks ORDER BY block_type ASC')
      .all() as Array<{ block_type: string }>

    const seededTypes = rows.map((row) => row.block_type).sort()
    expect(seededTypes).toEqual([...EXPECTED_PROTECTED_BLOCK_TYPES].sort())
  })

  it('seeds default_buffer_percent and doomscroll_allowance_minutes settings', () => {
    dbPath = createTempDatabasePath()
    testDb = openDatabase(dbPath)
    runMigrations(testDb)

    const buffer = testDb
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get('default_buffer_percent') as { value: string }
    const doomscroll = testDb
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get('doomscroll_allowance_minutes') as { value: string }

    expect(JSON.parse(buffer.value)).toBe(10)
    expect(JSON.parse(doomscroll.value)).toBe(5)
  })

  it('seeds max_buffer_minutes setting', () => {
    dbPath = createTempDatabasePath()
    testDb = openDatabase(dbPath)
    runMigrations(testDb)

    const maxBuffer = testDb
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get('max_buffer_minutes') as { value: string }

    expect(JSON.parse(maxBuffer.value)).toBe(60)
  })

  it('seeds display preference defaults', () => {
    dbPath = createTempDatabasePath()
    testDb = openDatabase(dbPath)
    runMigrations(testDb)

    const timeFormat = testDb
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get('time_format') as { value: string }
    const weekStartsOn = testDb
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get('week_starts_on') as { value: string }
    const dateFormat = testDb
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get('date_format') as { value: string }
    const defaultSleepTime = testDb
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get('default_sleep_time') as { value: string }

    expect(JSON.parse(timeFormat.value)).toBe('12h')
    expect(JSON.parse(weekStartsOn.value)).toBe('sunday')
    expect(JSON.parse(dateFormat.value)).toBe('mdy')
    expect(JSON.parse(defaultSleepTime.value)).toBe('23:00')
  })

  it('seeds timezone setting', () => {
    dbPath = createTempDatabasePath()
    testDb = openDatabase(dbPath)
    runMigrations(testDb)

    const timezone = testDb
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get('timezone') as { value: string }

    expect(typeof JSON.parse(timezone.value)).toBe('string')
    expect(JSON.parse(timezone.value).length).toBeGreaterThan(0)
  })

  it('migrates legacy UTC timezone to the system timezone', () => {
    dbPath = createTempDatabasePath()
    testDb = openDatabase(dbPath)
    runMigrations(testDb)

    testDb
      .prepare('UPDATE app_settings SET value = ?, updated_at = ? WHERE key = ?')
      .run(JSON.stringify('UTC'), new Date().toISOString(), 'timezone')

    applyTimezoneLegacyFixMigration(testDb)

    const timezone = testDb
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get('timezone') as { value: string }

    expect(JSON.parse(timezone.value)).toBe(resolveDefaultTimezone())
  })

  it('seeds system unassigned client', () => {
    dbPath = createTempDatabasePath()
    testDb = openDatabase(dbPath)
    runMigrations(testDb)

    const row = testDb
      .prepare('SELECT name, weight_percent FROM clients_projects WHERE name = ?')
      .get('__unassigned__') as { name: string; weight_percent: number }

    expect(row.name).toBe('__unassigned__')
    expect(row.weight_percent).toBe(0)
  })
})
