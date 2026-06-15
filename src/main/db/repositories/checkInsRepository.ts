import type Database from 'better-sqlite3'
import type { CheckInLogRow } from '@shared/types/db'
import { nowIso } from '@shared/utils/time'

export interface InsertCheckInInput {
  client_project_id: number
  check_in_date: string
  scheduled_at: string
  acknowledged_at: string
  actual_interval_minutes: number | null
}

export function getLastCheckInForDate(
  db: Database.Database,
  clientProjectId: number,
  checkInDate: string
): CheckInLogRow | null {
  const row = db
    .prepare(
      `
      SELECT *
      FROM check_ins_log
      WHERE client_project_id = ?
        AND check_in_date = ?
      ORDER BY acknowledged_at DESC
      LIMIT 1
    `
    )
    .get(clientProjectId, checkInDate) as CheckInLogRow | undefined

  return row ?? null
}

export function listCheckInsInRange(
  db: Database.Database,
  startDate: string,
  endDate: string
): CheckInLogRow[] {
  return db
    .prepare(
      `
      SELECT *
      FROM check_ins_log
      WHERE check_in_date >= @startDate
        AND check_in_date <= @endDate
      ORDER BY acknowledged_at ASC
    `
    )
    .all({ startDate, endDate }) as CheckInLogRow[]
}

export function insertCheckIn(
  db: Database.Database,
  input: InsertCheckInInput
): CheckInLogRow {
  const createdAt = nowIso()
  const result = db
    .prepare(
      `
      INSERT INTO check_ins_log (
        client_project_id,
        check_in_date,
        scheduled_at,
        acknowledged_at,
        actual_interval_minutes,
        created_at
      ) VALUES (
        @client_project_id,
        @check_in_date,
        @scheduled_at,
        @acknowledged_at,
        @actual_interval_minutes,
        @created_at
      )
    `
    )
    .run({
      ...input,
      created_at: createdAt,
    })

  const row = db
    .prepare('SELECT * FROM check_ins_log WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as CheckInLogRow

  return row
}

export function computeActualIntervalMinutes(
  acknowledgedAt: string,
  previousAcknowledgedAt: string | null
): number | null {
  if (!previousAcknowledgedAt) {
    return null
  }

  const diffMs =
    new Date(acknowledgedAt).getTime() - new Date(previousAcknowledgedAt).getTime()
  return Math.max(0, Math.round(diffMs / 60_000))
}
