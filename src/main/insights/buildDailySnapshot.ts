import type Database from 'better-sqlite3'
import { composeDailySnapshot, buildBumpedTasksFromRows } from '@shared/insights/composeDailySnapshot'
import type { DailyInsightSnapshot } from '@shared/types/insights'
import type { TaskRow } from '@shared/types/db'
import { nowIso } from '@shared/utils/time'
import { listClients } from '../db/repositories/clientsRepository'
import { getAllSettings } from '../db/repositories/appSettingsRepository'
import { listBlocksForDate } from '../db/repositories/dailyScheduleRepository'
import { getJournalEntry, getJournalStats } from '../services/journalService'
import { getReviewSummary } from '../services/reviewService'

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function listTasksForSnapshot(db: Database.Database): Array<{
  id: number
  client_id: number
  title: string
  description: string | null
  priority: number
  is_urgent: number | null
  is_important: number | null
  deadline_date: string | null
  estimated_minutes: number | null
  status: string
  deferred_to_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  client_name: string
}> {
  return db
    .prepare(
      `
      SELECT
        t.id,
        t.client_id,
        t.title,
        t.description,
        t.priority,
        t.is_urgent,
        t.is_important,
        t.deadline_date,
        t.estimated_minutes,
        t.status,
        t.deferred_to_date,
        t.completed_at,
        t.created_at,
        t.updated_at,
        cp.name AS client_name
      FROM tasks t
      JOIN clients_projects cp ON cp.id = t.client_id
      WHERE t.status != 'cancelled'
      ORDER BY t.priority ASC, t.created_at ASC
    `
    )
    .all() as Array<{
    id: number
    client_id: number
    title: string
    description: string | null
    priority: number
    is_urgent: number | null
    is_important: number | null
    deadline_date: string | null
    estimated_minutes: number | null
    status: string
    deferred_to_date: string | null
    completed_at: string | null
    created_at: string
    updated_at: string
    client_name: string
  }>
}

export function buildDailySnapshot(
  db: Database.Database,
  scheduleDate: string
): DailyInsightSnapshot {
  const settings = getAllSettings(db)
  const blocks = listBlocksForDate(db, scheduleDate)
  const tasks = listTasksForSnapshot(db)
  const clients = listClients(db)
  const journalStats = getJournalStats(db, scheduleDate)
  const todayEntry = getJournalEntry(db, scheduleDate)
  const yesterday = addDays(scheduleDate, -1)

  let yesterdaySummary = null
  try {
    yesterdaySummary = getReviewSummary(db, {
      startDate: yesterday,
      endDate: yesterday,
    })
  } catch {
    yesterdaySummary = null
  }

  const bumpedTasks = buildBumpedTasksFromRows(tasks as Array<TaskRow & { client_name: string }>, scheduleDate)

  return composeDailySnapshot({
    scheduleDate,
    generatedAt: nowIso(),
    blocks,
    tasks: tasks as TaskRow[],
    clients,
    stalenessSettings: {
      defaultStalenessHours: settings.defaultStalenessHours,
    },
    faith: {
      currentStreak: journalStats.currentStreak,
      longestStreak: journalStats.longestStreak,
      todayEntryLogged: Boolean(todayEntry?.bible_reference?.trim()),
      todayBibleReference: todayEntry?.bible_reference ?? null,
    },
    yesterdaySummary,
    bumpedTasks,
  })
}
