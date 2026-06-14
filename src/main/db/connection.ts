import { mkdirSync } from 'fs'
import { dirname, join } from 'path'
import Database from 'better-sqlite3'
import { getLatestSchemaVersion, listUserTableNames, runMigrations } from './migrations/runner'

const DATABASE_FILE_NAME = 'focus-os.db'

let databaseInstance: Database.Database | null = null
let databasePathValue: string | null = null

function getElectronUserDataPath(): string {
  // Dynamic require keeps electron out of Vitest imports; only called from main process init.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const electron = require('electron') as typeof import('electron')
  return electron.app.getPath('userData')
}

export function resolveDatabasePath(customPath?: string): string {
  if (customPath) {
    return customPath
  }

  if (process.env.FOCUS_OS_DB_PATH) {
    return process.env.FOCUS_OS_DB_PATH
  }

  return join(getElectronUserDataPath(), DATABASE_FILE_NAME)
}

export function openDatabase(dbPath: string): Database.Database {
  mkdirSync(dirname(dbPath), { recursive: true })

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  return db
}

export function initializeDatabase(customPath?: string): Database.Database {
  if (databaseInstance) {
    return databaseInstance
  }

  const dbPath = resolveDatabasePath(customPath)
  const db = openDatabase(dbPath)
  runMigrations(db)

  databaseInstance = db
  databasePathValue = dbPath
  return db
}

export function getDatabase(): Database.Database {
  if (!databaseInstance) {
    throw new Error('Database has not been initialized')
  }
  return databaseInstance
}

export function getDatabasePath(): string {
  if (!databasePathValue) {
    throw new Error('Database path is unavailable before initialization')
  }
  return databasePathValue
}

export function getDatabaseHealth(): {
  databasePath: string
  schemaVersion: number
  tableCount: number
  clientCount: number
  protectedBlockCount: number
} {
  const db = getDatabase()
  const tableCount = listUserTableNames(db).length
  const clientCount = (db.prepare('SELECT COUNT(*) AS count FROM clients_projects').get() as {
    count: number
  }).count
  const protectedBlockCount = (db.prepare('SELECT COUNT(*) AS count FROM protected_blocks').get() as {
    count: number
  }).count

  return {
    databasePath: getDatabasePath(),
    schemaVersion: getLatestSchemaVersion(db),
    tableCount,
    clientCount,
    protectedBlockCount,
  }
}

export function closeDatabase(): void {
  if (databaseInstance) {
    databaseInstance.close()
    databaseInstance = null
    databasePathValue = null
  }
}
