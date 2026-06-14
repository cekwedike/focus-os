import type Database from 'better-sqlite3'
import type { ReviewBreakRow, ReviewDateRangePayload, ReviewScheduleRow, ReviewSummary } from '@shared/types/review'
import { analyzeBreaks } from '@shared/review/breakAnalysis'
import {
  aggregateClientGroups,
  aggregateProtectedDaySummaries,
  aggregateProtectedGroups,
} from '@shared/review/plannedVsActual'
import { calculateTaskCompletionRate } from '@shared/review/taskCompletion'

export function listScheduleRowsInRange(
  db: Database.Database,
  startDate: string,
  endDate: string
): ReviewScheduleRow[] {
  return db
    .prepare(
      `
      SELECT
        ds.schedule_date,
        ds.block_type,
        ds.protected_subtype,
        ds.client_id,
        cp.name AS client_name,
        ds.planned_duration_minutes,
        ds.actual_duration_minutes,
        ds.actual_start,
        ds.actual_end,
        ds.status,
        ds.task_id
      FROM daily_schedule ds
      LEFT JOIN clients_projects cp ON cp.id = ds.client_id
      WHERE ds.schedule_date >= @startDate
        AND ds.schedule_date <= @endDate
      ORDER BY ds.schedule_date ASC, ds.priority_order ASC
    `
    )
    .all({ startDate, endDate }) as ReviewScheduleRow[]
}

export function listBreakRowsInRange(
  db: Database.Database,
  startDate: string,
  endDate: string
): ReviewBreakRow[] {
  return db
    .prepare(
      `
      SELECT break_type, reason, duration_minutes
      FROM breaks_log
      WHERE break_date >= @startDate AND break_date <= @endDate
    `
    )
    .all({ startDate, endDate }) as ReviewBreakRow[]
}

export function getReviewSummary(
  db: Database.Database,
  payload: ReviewDateRangePayload
): ReviewSummary {
  const scheduleRows = listScheduleRowsInRange(db, payload.startDate, payload.endDate)
  const breakRows = listBreakRowsInRange(db, payload.startDate, payload.endDate)

  const clientGroups = aggregateClientGroups(scheduleRows)
  const protectedGroups = aggregateProtectedGroups(scheduleRows)
  const protectedDaySummaries = aggregateProtectedDaySummaries(scheduleRows)
  const breakAnalysis = analyzeBreaks(breakRows)
  const taskCompletion = calculateTaskCompletionRate(scheduleRows)

  return {
    startDate: payload.startDate,
    endDate: payload.endDate,
    clientGroups,
    protectedGroups,
    protectedDaySummaries,
    microBreaks: breakAnalysis.microBreaks,
    longBreaks: breakAnalysis.longBreaks,
    longBreakReasons: breakAnalysis.longBreakReasons,
    taskCompletionRate: taskCompletion.taskCompletionRate,
    scheduledTaskBlocks: taskCompletion.scheduledTaskBlocks,
    completedTaskBlocks: taskCompletion.completedTaskBlocks,
  }
}
