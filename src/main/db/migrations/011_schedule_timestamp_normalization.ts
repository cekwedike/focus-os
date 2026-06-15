import type Database from 'better-sqlite3'
import { normalizeScheduleInstant } from '@shared/utils/scheduleTimestamp'

export function applyScheduleTimestampNormalizationMigration(db: Database.Database): void {
  const rows = db
    .prepare('SELECT id, planned_start, planned_end FROM daily_schedule')
    .all() as Array<{ id: number; planned_start: string; planned_end: string }>

  const update = db.prepare(
    `
    UPDATE daily_schedule
    SET planned_start = @planned_start,
        planned_end = @planned_end,
        updated_at = @updated_at
    WHERE id = @id
  `
  )

  const updatedAt = new Date().toISOString()

  for (const row of rows) {
    const plannedStart = normalizeScheduleInstant(row.planned_start)
    const plannedEnd = normalizeScheduleInstant(row.planned_end)

    if (plannedStart === row.planned_start && plannedEnd === row.planned_end) {
      continue
    }

    update.run({
      id: row.id,
      planned_start: plannedStart,
      planned_end: plannedEnd,
      updated_at: updatedAt,
    })
  }
}
