import type Database from 'better-sqlite3'
import type { AllocationOutput, ReallocationOutput } from '@shared/allocation/types'
import { calculateFocusScore } from '@shared/utils/focusScore'
import type { DailyScheduleRow } from '@shared/types/db'
import type {
  DayBundle,
  ScheduleCommitPayload,
  ScheduleGeneratePayload,
  ScheduleReallocatePayload,
} from '@shared/types/schedule'
import { nowIso } from '@shared/utils/time'
import {
  buildWakeIso,
  runPreviewAllocation,
  runPersistedReallocation,
} from '../allocation/allocationHelpers'
import {
  deactivateOtherActiveBlocks,
  getActiveBlock,
  getBlockById,
  hasCommittedBlocksForDate,
  insertBlocks,
  listBlocksForDate,
  mapRowToEngineBlock,
  markBlocksSuperseded,
  updateBlock,
} from '../db/repositories/dailyScheduleRepository'
import {
  getDailySettings,
  incrementAllocationVersion,
  upsertDailySettings,
} from '../db/repositories/dailySettingsRepository'
import {
  bumpTasksToDate,
  listTasksForAllocation,
} from '../db/repositories/tasksRepository'
import { shouldAutoCompleteBlock } from '@shared/schedule/blockAutoComplete'
import { activateFirstBlockIfNone } from './blockProgressionService'

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function mapTaskRow(row: {
  id: number
  client_id: number
  title: string
  priority: number
  deadline_date: string | null
  estimated_minutes: number | null
  status: string
  deferred_to_date: string | null
  created_at: string
}) {
  return row
}

export function getDayBundle(db: Database.Database, date: string): DayBundle {
  const blocks = listBlocksForDate(db, date)
  const settings = getDailySettings(db, date)
  return {
    date,
    settings,
    blocks,
    focusScore: calculateFocusScore(blocks),
  }
}

export function previewDaySchedule(
  db: Database.Database,
  payload: ScheduleGeneratePayload
): AllocationOutput {
  const tasks = listTasksForAllocation(db, payload.scheduleDate).map(mapTaskRow)
  return runPreviewAllocation(db, payload, tasks)
}

export function commitDaySchedule(
  db: Database.Database,
  payload: ScheduleCommitPayload
): DayBundle {
  const hasExisting = hasCommittedBlocksForDate(db, payload.scheduleDate)
  if (hasExisting && !payload.confirmOverwrite) {
    throw new Error('SCHEDULE_EXISTS')
  }

  const commit = db.transaction(() => {
    if (hasExisting) {
      markBlocksSuperseded(db, payload.scheduleDate)
    }

    upsertDailySettings(db, payload.settings)
    insertBlocks(db, payload.scheduleDate, payload.blocks)
    incrementAllocationVersion(db, payload.scheduleDate)
  })

  commit()
  activateFirstBlockIfNone(db, payload.scheduleDate)
  return getDayBundle(db, payload.scheduleDate)
}

export function startBlock(db: Database.Database, blockId: number): DailyScheduleRow {
  const block = getBlockById(db, blockId)
  if (!block) {
    throw new Error('BLOCK_NOT_FOUND')
  }

  deactivateOtherActiveBlocks(db, block.schedule_date, blockId)
  const updated = updateBlock(db, blockId, {
    status: 'active',
    actual_start: nowIso(),
  })

  if (!updated) {
    throw new Error('BLOCK_UPDATE_FAILED')
  }

  if (updated.client_id) {
    db.prepare('UPDATE clients_projects SET last_touched_at = @ts, updated_at = @ts WHERE id = @id').run({
      id: updated.client_id,
      ts: nowIso(),
    })
  }

  return updated
}

export function completeBlock(
  db: Database.Database,
  blockId: number,
  options?: { endTime?: string }
): DailyScheduleRow {
  const block = getBlockById(db, blockId)
  if (!block) {
    throw new Error('BLOCK_NOT_FOUND')
  }

  const endTime = options?.endTime ?? nowIso()
  let actualDuration = block.planned_duration_minutes

  if (block.actual_start) {
    const startMs = new Date(block.actual_start).getTime()
    const endMs = new Date(endTime).getTime()
    actualDuration = Math.max(1, Math.round((endMs - startMs) / 60_000))
  }

  const updated = updateBlock(db, blockId, {
    status: 'completed',
    actual_end: endTime,
    actual_duration_minutes: actualDuration,
  })

  if (!updated) {
    throw new Error('BLOCK_UPDATE_FAILED')
  }

  if (updated.client_id) {
    db.prepare('UPDATE clients_projects SET last_touched_at = @ts, updated_at = @ts WHERE id = @id').run({
      id: updated.client_id,
      ts: nowIso(),
    })
  }

  return updated
}

export function updateBlockTimes(
  db: Database.Database,
  blockId: number,
  plannedStart: string,
  plannedEnd: string
): DailyScheduleRow {
  const block = getBlockById(db, blockId)
  if (!block) {
    throw new Error('BLOCK_NOT_FOUND')
  }

  const startMs = new Date(plannedStart).getTime()
  const endMs = new Date(plannedEnd).getTime()
  const duration = Math.max(1, Math.round((endMs - startMs) / 60_000))

  const updated = updateBlock(db, blockId, {
    planned_start: plannedStart,
    planned_end: plannedEnd,
    planned_duration_minutes: duration,
  })

  if (!updated) {
    throw new Error('BLOCK_UPDATE_FAILED')
  }

  return updated
}

export function applyReallocationAfterLongBreak(
  db: Database.Database,
  payload: ScheduleReallocatePayload
): ReallocationOutput & { dayBundle: DayBundle } {
  const existingRows = listBlocksForDate(db, payload.scheduleDate, true).filter(
    (row) => row.status !== 'superseded'
  )
  const existingBlocks = existingRows.map(mapRowToEngineBlock)

  const settings = getDailySettings(db, payload.scheduleDate)
  const wakeTime = settings?.wake_time
    ? buildWakeIso(payload.scheduleDate, settings.wake_time)
    : payload.returnTime

  const params = {
    scheduleDate: payload.scheduleDate,
    wakeTime,
    sleepTargetTime: settings?.sleep_target_time ?? undefined,
    bufferPercent: settings?.buffer_percent,
    capacityMinutes: settings?.remaining_minutes_at_wake ?? undefined,
  }

  const tasks = listTasksForAllocation(db, payload.scheduleDate).map(mapTaskRow)
  const result = runPersistedReallocation(
    db,
    params,
    tasks,
    existingBlocks,
    payload.returnTime,
    payload.longBreakDurationMinutes
  )

  const apply = db.transaction(() => {
    markBlocksSuperseded(db, payload.scheduleDate)
    insertBlocks(db, payload.scheduleDate, result.blocks)

    if (result.bumpedTaskIds.length > 0) {
      bumpTasksToDate(db, result.bumpedTaskIds, addDays(payload.scheduleDate, 1))
    }

    if (settings) {
      incrementAllocationVersion(db, payload.scheduleDate)
    }
  })

  apply()

  return {
    ...result,
    dayBundle: getDayBundle(db, payload.scheduleDate),
  }
}

export function getActiveBlockForDate(
  db: Database.Database,
  scheduleDate: string
): DailyScheduleRow | null {
  return getActiveBlock(db, scheduleDate)
}

export function autoCompleteActiveBlockIfDue(
  db: Database.Database,
  scheduleDate: string,
  nowMs = Date.now()
): DailyScheduleRow | null {
  const activeBlock = getActiveBlock(db, scheduleDate)
  if (!activeBlock || !shouldAutoCompleteBlock(activeBlock, nowMs)) {
    return null
  }

  return completeBlock(db, activeBlock.id, { endTime: activeBlock.planned_end })
}
