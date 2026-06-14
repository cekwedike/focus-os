import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { closeDatabase, openDatabase } from '../../src/main/db/connection'
import { runMigrations } from '../../src/main/db/migrations/runner'
import {
  createTask,
  getUnassignedClientId,
  listTasks,
  updateTask,
} from '../../src/main/db/repositories/tasksRepository'

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'focus-os-task-test-'))
  return join(directory, 'focus-os.test.db')
}

describe('tasksRepository', () => {
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

  it('creates and filters high-priority tasks', () => {
    dbPath = createTempDatabasePath()
    testDb = openDatabase(dbPath)
    runMigrations(testDb)

    const unassignedId = getUnassignedClientId(testDb)
    createTask(testDb, {
      client_id: unassignedId,
      title: 'Low priority task',
      priority: 4,
    })
    const high = createTask(testDb, {
      client_id: unassignedId,
      title: 'High priority task',
      priority: 2,
    })

    const results = listTasks(testDb, { priorityMax: 2 })
    expect(results.some((task) => task.id === high.id)).toBe(true)
    expect(results.every((task) => task.priority <= 2)).toBe(true)
  })

  it('marks tasks completed with completed_at timestamp', () => {
    dbPath = createTempDatabasePath()
    testDb = openDatabase(dbPath)
    runMigrations(testDb)

    const unassignedId = getUnassignedClientId(testDb)
    const created = createTask(testDb, {
      client_id: unassignedId,
      title: 'Finish report',
      priority: 2,
    })

    const updated = updateTask(testDb, { id: created.id, status: 'completed' })
    expect(updated?.status).toBe('completed')
    expect(updated?.completed_at).not.toBeNull()
  })
})
