import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { closeDatabase, openDatabase } from '../../src/main/db/connection'
import { runMigrations } from '../../src/main/db/migrations/runner'
import { extendActiveBlock } from '../../src/main/services/blockProgressionService'
import { getBlockById, insertBlocks, updateBlock } from '../../src/main/db/repositories/dailyScheduleRepository'
import type { ScheduleBlock } from '../../src/shared/allocation/types'

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'focus-os-extend-'))
  return join(directory, 'focus-os.test.db')
}

describe('extendActiveBlock', () => {
  let dbPath = ''
  let db: ReturnType<typeof openDatabase> | null = null
  const scheduleDate = '2026-06-15'

  afterEach(() => {
    if (db) {
      db.close()
      db = null
    }
    closeDatabase()
    if (dbPath) {
      rmSync(join(dbPath, '..'), { recursive: true, force: true })
      dbPath = ''
    }
  })

  it('extends the active block and shifts subsequent blocks later', () => {
    dbPath = createTempDatabasePath()
    db = openDatabase(dbPath)
    runMigrations(db)

    const blocks: ScheduleBlock[] = [
      {
        tempId: 'a',
        scheduleDate,
        blockType: 'weighted_client',
        title: 'Active',
        plannedStart: `${scheduleDate}T09:00:00`,
        plannedEnd: `${scheduleDate}T09:30:00`,
        plannedDurationMinutes: 30,
        priorityOrder: 0,
        status: 'planned',
      },
      {
        tempId: 'b',
        scheduleDate,
        blockType: 'weighted_client',
        title: 'Later',
        plannedStart: `${scheduleDate}T09:30:00`,
        plannedEnd: `${scheduleDate}T10:00:00`,
        plannedDurationMinutes: 30,
        priorityOrder: 1,
        status: 'planned',
      },
    ]

    const rows = insertBlocks(db, scheduleDate, blocks)
    updateBlock(db, rows[0].id, {
      status: 'active',
      actual_start: `${scheduleDate}T09:00:00`,
    })

    extendActiveBlock(db, rows[0].id, 5)
    const active = getBlockById(db, rows[0].id)
    const later = getBlockById(db, rows[1].id)

    expect(active?.planned_end).toBe(`${scheduleDate}T09:35:00`)
    expect(later?.planned_start).toBe(`${scheduleDate}T09:35:00`)
    expect(later?.planned_end).toBe(`${scheduleDate}T10:05:00`)
  })

  it('allows multiple extends to compound', () => {
    dbPath = createTempDatabasePath()
    db = openDatabase(dbPath)
    runMigrations(db)

    const rows = insertBlocks(db, scheduleDate, [
      {
        tempId: 'a',
        scheduleDate,
        blockType: 'weighted_client',
        title: 'Active',
        plannedStart: `${scheduleDate}T09:00:00`,
        plannedEnd: `${scheduleDate}T09:30:00`,
        plannedDurationMinutes: 30,
        priorityOrder: 0,
        status: 'planned',
      },
    ])
    updateBlock(db, rows[0].id, {
      status: 'active',
      actual_start: `${scheduleDate}T09:00:00`,
    })

    extendActiveBlock(db, rows[0].id, 5)
    extendActiveBlock(db, rows[0].id, 5)
    const active = getBlockById(db, rows[0].id)
    expect(active?.planned_end).toBe(`${scheduleDate}T09:40:00`)
    expect(active?.planned_duration_minutes).toBe(40)
  })
})
