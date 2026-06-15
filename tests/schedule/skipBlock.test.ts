import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { closeDatabase, openDatabase } from '../../src/main/db/connection'
import { runMigrations } from '../../src/main/db/migrations/runner'
import { skipBlock } from '../../src/main/services/blockProgressionService'
import { getActiveBlock, getBlockById, insertBlocks, updateBlock } from '../../src/main/db/repositories/dailyScheduleRepository'
import type { ScheduleBlock } from '../../src/shared/allocation/types'

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'focus-os-skip-'))
  return join(directory, 'focus-os.test.db')
}

describe('skipBlock', () => {
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

  it('marks block skipped, reclaims time, and advances', () => {
    dbPath = createTempDatabasePath()
    db = openDatabase(dbPath)
    runMigrations(db)

    const blocks: ScheduleBlock[] = [
      {
        tempId: 'meal',
        scheduleDate,
        blockType: 'protected',
        protectedSubtype: 'meal',
        title: 'Lunch',
        plannedStart: `${scheduleDate}T12:00:00.000Z`,
        plannedEnd: `${scheduleDate}T12:30:00.000Z`,
        plannedDurationMinutes: 30,
        priorityOrder: 0,
        status: 'planned',
      },
      {
        tempId: 'work',
        scheduleDate,
        blockType: 'weighted_client',
        title: 'Client work',
        plannedStart: `${scheduleDate}T12:30:00.000Z`,
        plannedEnd: `${scheduleDate}T13:00:00.000Z`,
        plannedDurationMinutes: 30,
        priorityOrder: 1,
        status: 'planned',
      },
    ]

    const rows = insertBlocks(db, scheduleDate, blocks)
    updateBlock(db, rows[0].id, {
      status: 'active',
      actual_start: `${scheduleDate}T12:00:00.000Z`,
    })

    const nowMs = new Date(`${scheduleDate}T12:10:00.000Z`).getTime()
    const originalDateNow = Date.now
    Date.now = () => nowMs

    try {
      const result = skipBlock(db, rows[0].id)
      expect(result.completedBlock?.status).toBe('skipped')
      expect(result.nextBlock?.title).toBe('Client work')
      expect(getActiveBlock(db, scheduleDate)?.title).toBe('Client work')

      const later = getBlockById(db, rows[1].id)
      expect(later?.planned_start).toBe(`${scheduleDate}T12:10:00.000Z`)
      expect(later?.planned_end).toBe(`${scheduleDate}T12:40:00.000Z`)
    } finally {
      Date.now = originalDateNow
    }
  })

  it('rejects non-skippable faith blocks', () => {
    dbPath = createTempDatabasePath()
    db = openDatabase(dbPath)
    runMigrations(db)

    const rows = insertBlocks(db, scheduleDate, [
      {
        tempId: 'faith',
        scheduleDate,
        blockType: 'protected',
        protectedSubtype: 'faith',
        title: 'Faith and prayer',
        plannedStart: `${scheduleDate}T08:00:00.000Z`,
        plannedEnd: `${scheduleDate}T08:25:00.000Z`,
        plannedDurationMinutes: 25,
        priorityOrder: 0,
        status: 'planned',
      },
    ])

    updateBlock(db, rows[0].id, {
      status: 'active',
      actual_start: `${scheduleDate}T08:00:00.000Z`,
    })

    expect(() => skipBlock(db, rows[0].id)).toThrow('BLOCK_NOT_SKIPPABLE')
  })
})
