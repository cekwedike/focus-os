import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { closeDatabase, openDatabase } from '../../src/main/db/connection'
import { runMigrations } from '../../src/main/db/migrations/runner'
import {
  activateFirstBlockIfNone,
  autoCompleteAndAdvance,
  completeAndAdvance,
} from '../../src/main/services/blockProgressionService'
import { getActiveBlock, insertBlocks, updateBlock } from '../../src/main/db/repositories/dailyScheduleRepository'
import { setWorkPaused, resetPauseTracking } from '../../src/main/services/workPauseService'
import type { ScheduleBlock } from '../../src/shared/allocation/types'

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'focus-os-progression-'))
  return join(directory, 'focus-os.test.db')
}

function sampleBlocks(scheduleDate: string): ScheduleBlock[] {
  const start = `${scheduleDate}T09:00:00.000Z`
  const mid = `${scheduleDate}T09:30:00.000Z`
  const end = `${scheduleDate}T10:00:00.000Z`

  return [
    {
      tempId: 'a',
      scheduleDate,
      blockType: 'weighted_client',
      title: 'Client A',
      plannedStart: start,
      plannedEnd: mid,
      plannedDurationMinutes: 30,
      priorityOrder: 0,
      status: 'planned',
    },
    {
      tempId: 'b',
      scheduleDate,
      blockType: 'weighted_client',
      title: 'Client B',
      plannedStart: mid,
      plannedEnd: end,
      plannedDurationMinutes: 30,
      priorityOrder: 1,
      status: 'planned',
    },
  ]
}

describe('block progression', () => {
  let dbPath = ''
  let db: ReturnType<typeof openDatabase> | null = null
  const scheduleDate = '2026-06-15'

  afterEach(() => {
    resetPauseTracking()
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

  it('activates the first planned block when none is active', () => {
    dbPath = createTempDatabasePath()
    db = openDatabase(dbPath)
    runMigrations(db)
    insertBlocks(db, scheduleDate, sampleBlocks(scheduleDate))

    const started = activateFirstBlockIfNone(db, scheduleDate)
    expect(started?.status).toBe('active')
    expect(started?.title).toBe('Client A')
  })

  it('auto-completes and advances at planned end', () => {
    dbPath = createTempDatabasePath()
    db = openDatabase(dbPath)
    runMigrations(db)
    const rows = insertBlocks(db, scheduleDate, sampleBlocks(scheduleDate))
    updateBlock(db, rows[0].id, {
      status: 'active',
      actual_start: `${scheduleDate}T09:00:00.000Z`,
    })

    const result = autoCompleteAndAdvance(
      db,
      scheduleDate,
      new Date(`${scheduleDate}T09:30:00.000Z`).getTime()
    )

    expect(result?.completedBlock?.status).toBe('completed')
    expect(result?.nextBlock?.title).toBe('Client B')
    expect(getActiveBlock(db, scheduleDate)?.title).toBe('Client B')
  })

  it('does not auto-complete while paused', () => {
    dbPath = createTempDatabasePath()
    db = openDatabase(dbPath)
    runMigrations(db)
    const rows = insertBlocks(db, scheduleDate, sampleBlocks(scheduleDate))
    updateBlock(db, rows[0].id, {
      status: 'active',
      actual_start: `${scheduleDate}T09:00:00.000Z`,
    })
    setWorkPaused(true)

    const result = autoCompleteAndAdvance(
      db,
      scheduleDate,
      new Date(`${scheduleDate}T09:30:00.000Z`).getTime()
    )

    expect(result).toBeNull()
    expect(getActiveBlock(db, scheduleDate)?.title).toBe('Client A')
  })

  it('handles end of day when no next block exists', () => {
    dbPath = createTempDatabasePath()
    db = openDatabase(dbPath)
    runMigrations(db)
    const rows = insertBlocks(db, scheduleDate, [sampleBlocks(scheduleDate)[1]])
    updateBlock(db, rows[0].id, {
      status: 'active',
      actual_start: `${scheduleDate}T09:30:00.000Z`,
    })

    const result = completeAndAdvance(db, rows[0].id, {
      endTime: `${scheduleDate}T10:00:00.000Z`,
      reason: 'manual_completed',
    })

    expect(result.nextBlock).toBeNull()
    expect(getActiveBlock(db, scheduleDate)).toBeNull()
  })
})
