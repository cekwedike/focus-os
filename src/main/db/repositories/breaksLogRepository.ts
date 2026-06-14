import type Database from 'better-sqlite3'
import type { BreakLogRow } from '@shared/types/db'
import type { BreakListFilters, CreateBreakInput, UpdateBreakInput } from '@shared/types/breaks'
import { nowIso } from '@shared/utils/time'

export function listBreaks(db: Database.Database, filters: BreakListFilters = {}): BreakLogRow[] {
  const conditions: string[] = []
  const params: Record<string, unknown> = {}

  if (filters.breakDate) {
    conditions.push('break_date = @breakDate')
    params.breakDate = filters.breakDate
  }

  if (filters.breakType) {
    conditions.push('break_type = @breakType')
    params.breakType = filters.breakType
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  return db
    .prepare(
      `
      SELECT *
      FROM breaks_log
      ${whereClause}
      ORDER BY started_at DESC
    `
    )
    .all(params) as BreakLogRow[]
}

export function getBreakById(db: Database.Database, id: number): BreakLogRow | null {
  const row = db.prepare('SELECT * FROM breaks_log WHERE id = ?').get(id) as
    | BreakLogRow
    | undefined
  return row ?? null
}

export function getActiveLongBreak(
  db: Database.Database,
  breakDate: string
): BreakLogRow | null {
  const row = db
    .prepare(
      `
      SELECT *
      FROM breaks_log
      WHERE break_date = @breakDate AND break_type = 'long' AND ended_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `
    )
    .get({ breakDate }) as BreakLogRow | undefined
  return row ?? null
}

export function createBreak(db: Database.Database, input: CreateBreakInput): BreakLogRow {
  const timestamp = nowIso()
  const result = db
    .prepare(
      `
      INSERT INTO breaks_log (
        break_date, break_type, started_at, ended_at, duration_minutes,
        reason, activity, client_id, schedule_block_id, created_at
      ) VALUES (
        @break_date, @break_type, @started_at, @ended_at, @duration_minutes,
        @reason, @activity, @client_id, @schedule_block_id, @created_at
      )
    `
    )
    .run({
      break_date: input.break_date,
      break_type: input.break_type,
      started_at: input.started_at,
      ended_at: input.ended_at ?? null,
      duration_minutes: input.duration_minutes ?? null,
      reason: input.reason ?? null,
      activity: input.activity ?? null,
      client_id: input.client_id ?? null,
      schedule_block_id: input.schedule_block_id ?? null,
      created_at: timestamp,
    })

  const created = getBreakById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to create break log entry')
  }
  return created
}

export function updateBreak(db: Database.Database, input: UpdateBreakInput): BreakLogRow | null {
  const existing = getBreakById(db, input.id)
  if (!existing) {
    return null
  }

  db.prepare(
    `
    UPDATE breaks_log SET
      ended_at = @ended_at,
      duration_minutes = @duration_minutes,
      reason = @reason,
      activity = @activity
    WHERE id = @id
  `
  ).run({
    id: input.id,
    ended_at: input.ended_at !== undefined ? input.ended_at : existing.ended_at,
    duration_minutes:
      input.duration_minutes !== undefined ? input.duration_minutes : existing.duration_minutes,
    reason: input.reason !== undefined ? input.reason : existing.reason,
    activity: input.activity !== undefined ? input.activity : existing.activity,
  })

  return getBreakById(db, input.id)
}
