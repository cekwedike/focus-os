import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { allocateDay } from '@shared/allocation'
import { baseInput } from '../allocation/fixtures'
import { closeDatabase, openDatabase } from '../../src/main/db/connection'
import { runMigrations } from '../../src/main/db/migrations/runner'
import {
  extendActiveBlock,
  skipBlock,
} from '../../src/main/services/blockProgressionService'
import {
  getBlockById,
  insertBlocks,
  listBlocksForDate,
  updateBlock,
} from '../../src/main/db/repositories/dailyScheduleRepository'
import { computeCountdownSeconds, formatCountdown } from '@shared/utils/remainingTime'
import {
  formatScheduleInstant,
  isLocalScheduleInstant,
  normalizeScheduleInstant,
} from '@shared/utils/scheduleTimestamp'
import type { ScheduleBlock } from '@shared/allocation/types'

function createTempDatabasePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'focus-os-schedule-ts-'))
  return join(directory, 'focus-os.test.db')
}

describe('schedule timestamp consistency', () => {
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

  it('allocation engine writes local schedule instants without Z suffix', () => {
    const output = allocateDay(
      baseInput({
        tasks: [],
        bufferPercent: 10,
        protectedBlocks: baseInput().protectedBlocks,
      })
    )

    const buffer = output.blocks.find((block) => block.blockType === 'buffer')
    expect(buffer).toBeDefined()

    for (const block of output.blocks) {
      expect(isLocalScheduleInstant(block.plannedStart)).toBe(true)
      expect(isLocalScheduleInstant(block.plannedEnd)).toBe(true)
    }
  })

  it('extend and skip keep subsequent blocks in local format', () => {
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
      {
        tempId: 'b',
        scheduleDate,
        blockType: 'buffer',
        title: 'Buffer',
        plannedStart: `${scheduleDate}T21:00:00`,
        plannedEnd: `${scheduleDate}T22:16:00`,
        plannedDurationMinutes: 76,
        priorityOrder: 1,
        status: 'planned',
      },
      {
        tempId: 'c',
        scheduleDate,
        blockType: 'protected',
        protectedSubtype: 'winddown',
        title: 'Wind-down',
        plannedStart: `${scheduleDate}T22:16:00`,
        plannedEnd: `${scheduleDate}T22:46:00`,
        plannedDurationMinutes: 30,
        priorityOrder: 2,
        status: 'planned',
      },
    ])

    updateBlock(db, rows[0].id, {
      status: 'active',
      actual_start: `${scheduleDate}T09:00:00`,
    })

    extendActiveBlock(db, rows[0].id, 5)

    for (const block of listBlocksForDate(db, scheduleDate)) {
      expect(isLocalScheduleInstant(block.planned_start)).toBe(true)
      expect(isLocalScheduleInstant(block.planned_end)).toBe(true)
      expect(block.planned_start).not.toContain('Z')
      expect(block.planned_end).not.toContain('Z')
    }

    const buffer = getBlockById(db, rows[1].id)
    expect(buffer?.planned_start).toBe(`${scheduleDate}T21:05:00`)
    expect(buffer?.planned_end).toBe(`${scheduleDate}T22:21:00`)
  })

  it('regression: buffer countdown matches planned duration, not inflated UTC mismatch', () => {
    const plannedDurationMinutes = 76
    const nowMs = new Date(2026, 5, 15, 12, 17, 29).getTime()
    const plannedStart = formatScheduleInstant(new Date(nowMs))
    const plannedEnd = formatScheduleInstant(
      new Date(nowMs + plannedDurationMinutes * 60_000)
    )

    const remainingSeconds = computeCountdownSeconds({
      nowMs,
      endsAt: plannedEnd,
      startedAt: plannedStart,
    })

    expect(formatCountdown(remainingSeconds)).toBe('1:16:00')
    expect(Math.round(remainingSeconds / 60)).toBe(plannedDurationMinutes)

    const corruptedUtcEnd = normalizeScheduleInstant('2026-06-15T20:10:00.000Z')
    const inflatedSeconds = computeCountdownSeconds({
      nowMs,
      endsAt: corruptedUtcEnd,
      startedAt: plannedStart,
    })

    expect(inflatedSeconds).toBeGreaterThan(plannedDurationMinutes * 60)
  })

  it('migration normalizes mixed UTC rows to local format', () => {
    dbPath = createTempDatabasePath()
    db = openDatabase(dbPath)
    runMigrations(db)

    const timestamp = new Date().toISOString()
    const result = db
      .prepare(
        `
        INSERT INTO daily_schedule (
          schedule_date, block_type, protected_subtype, client_id, task_id, title,
          planned_start, planned_end, planned_duration_minutes,
          actual_start, actual_end, actual_duration_minutes,
          status, priority_order, metadata_json, created_at, updated_at
        ) VALUES (
          @schedule_date, 'buffer', NULL, NULL, NULL, 'Buffer',
          @planned_start, @planned_end, 76,
          NULL, NULL, NULL,
          'planned', 0, NULL, @created_at, @updated_at
        )
      `
      )
      .run({
        schedule_date: scheduleDate,
        planned_start: `${scheduleDate}T20:54:00`,
        planned_end: `${scheduleDate}T20:10:00.000Z`,
        created_at: timestamp,
        updated_at: timestamp,
      })

    const before = getBlockById(db, Number(result.lastInsertRowid))
    expect(before?.planned_end).toContain('Z')

    db.exec('DELETE FROM schema_migrations WHERE version = 11')
    runMigrations(db)

    const after = getBlockById(db, Number(result.lastInsertRowid))
    expect(after?.planned_end).not.toContain('Z')
    expect(isLocalScheduleInstant(after?.planned_end ?? '')).toBe(true)

    const endMs = new Date(after!.planned_end).getTime()
    const startMs = new Date(after!.planned_start).getTime()
    expect(Math.round((endMs - startMs) / 60_000)).toBe(76)
  })

  it('skip reclaim preserves local timestamps on shifted blocks', () => {
    dbPath = createTempDatabasePath()
    db = openDatabase(dbPath)
    runMigrations(db)

    const nowMs = new Date(2026, 5, 15, 9, 10, 0).getTime()
    const rows = insertBlocks(db, scheduleDate, [
      {
        tempId: 'meal',
        scheduleDate,
        blockType: 'protected',
        protectedSubtype: 'meal',
        title: 'Lunch',
        plannedStart: formatScheduleInstant(new Date(nowMs)),
        plannedEnd: formatScheduleInstant(new Date(nowMs + 25 * 60_000)),
        plannedDurationMinutes: 25,
        priorityOrder: 0,
        status: 'planned',
      },
      {
        tempId: 'next',
        scheduleDate,
        blockType: 'weighted_client',
        title: 'Client work',
        plannedStart: formatScheduleInstant(new Date(nowMs + 25 * 60_000)),
        plannedEnd: formatScheduleInstant(new Date(nowMs + 55 * 60_000)),
        plannedDurationMinutes: 30,
        priorityOrder: 1,
        status: 'planned',
      },
    ])

    updateBlock(db, rows[0].id, {
      status: 'active',
      actual_start: formatScheduleInstant(new Date(nowMs)),
    })

    skipBlock(db, rows[0].id)

    for (const block of listBlocksForDate(db, scheduleDate)) {
      expect(isLocalScheduleInstant(block.planned_start)).toBe(true)
      expect(isLocalScheduleInstant(block.planned_end)).toBe(true)
    }
  })
})
