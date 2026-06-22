import type Database from 'better-sqlite3'
import type { DailyScheduleRow } from '@shared/types/db'
import type { BlockProgressionReason } from '@shared/schedule/blockProgressionMessages'
import {
  formatAutoProgressionMessage,
  formatExtendMessage,
  formatSkipMessage,
} from '@shared/schedule/blockProgressionMessages'
import { isBlockSkippable } from '@shared/schedule/blockSkippable'
import { isBlockStartDue } from '@shared/schedule/blockStartTiming'
import { extractLocalTimeHHMM } from '@shared/utils/scheduleTimestamp'
import { formatHHMM } from '@shared/utils/displayTime'
import {
  computeReclaimMinutes,
  shiftIsoByMinutes,
} from '@shared/schedule/blockTimeShift'
import { resolveContextualChips } from '@shared/chat/contextualChips'
import { mapChipsToProgressionActions } from '@shared/notifications/notificationActions'
import { nowIso } from '@shared/utils/time'
import { shouldAutoCompleteBlock } from '@shared/schedule/blockAutoComplete'
import {
  findNextPlannedBlock,
  getActiveBlock,
  getBlockById,
  shiftSubsequentBlocks,
  updateBlock,
} from '../db/repositories/dailyScheduleRepository'
import { listProtectedBlocks } from '../db/repositories/protectedBlocksRepository'
import { completeBlock, startBlock } from './scheduleService'
import { isBlockSnoozed, isAutoStartPaused } from './autoStartService'
import { notify } from './notificationService'
import { resetBlockNotificationState } from './blockNotificationService'
import { resetPauseTracking, isWorkPaused } from './workPauseService'

import type { BlockProgressionResult } from '@shared/types/schedule'

function formatBlockStartTime(plannedStart: string): string {
  return formatHHMM(extractLocalTimeHHMM(plannedStart), '12h')
}

function tryStartNextDueBlock(
  db: Database.Database,
  scheduleDate: string,
  nowMs: number
): DailyScheduleRow | null {
  if (isAutoStartPaused()) {
    return null
  }

  const next = findNextPlannedBlock(db, scheduleDate)
  if (!next || isBlockSnoozed(next.id) || !isBlockStartDue(next, nowMs)) {
    return null
  }

  return startBlock(db, next.id)
}

export function tryActivateDueBlock(
  db: Database.Database,
  scheduleDate: string,
  nowMs: number = Date.now()
): DailyScheduleRow | null {
  if (getActiveBlock(db, scheduleDate)) {
    return null
  }

  return tryStartNextDueBlock(db, scheduleDate, nowMs)
}

/** @deprecated Use tryActivateDueBlock */
export function activateFirstBlockIfNone(
  db: Database.Database,
  scheduleDate: string
): DailyScheduleRow | null {
  return tryActivateDueBlock(db, scheduleDate)
}

function postProgressionMessage(
  db: Database.Database,
  text: string,
  chipContext:
    | 'auto_progression'
    | 'manual_complete'
    | 'extend_confirmed'
    | 'skip_confirmed'
    | 'end_of_day',
  notificationType: 'block_complete' | 'block_skipped'
): void {
  const chips = resolveContextualChips(chipContext)
  const { actions, sendTextByActionId } = mapChipsToProgressionActions(chips, chipContext)

  notify(
    {
      type: notificationType,
      title: 'Focus OS',
      message: text,
      urgency: 'normal',
      persistent: false,
      dedupeKey: `${notificationType}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      actions,
      metadata: { sendTextByActionId, chipContext },
    },
    db
  )
}

export function advanceToNextBlock(
  db: Database.Database,
  scheduleDate: string,
  completedTitle: string,
  reason: BlockProgressionReason,
  nowMs: number = Date.now()
): BlockProgressionResult {
  const next = findNextPlannedBlock(db, scheduleDate)
  resetBlockNotificationState()
  resetPauseTracking()

  if (!next) {
    postProgressionMessage(
      db,
      formatAutoProgressionMessage(completedTitle, null),
      reason === 'manual_completed' ? 'manual_complete' : 'end_of_day',
      'block_complete'
    )

    return {
      completedBlock: null,
      nextBlock: null,
      reason,
    }
  }

  const started = tryStartNextDueBlock(db, scheduleDate, nowMs)
  postProgressionMessage(
    db,
    formatAutoProgressionMessage(completedTitle, next.title, {
      nextStartsAt: started ? undefined : formatBlockStartTime(next.planned_start),
    }),
    reason === 'manual_completed' ? 'manual_complete' : 'auto_progression',
    'block_complete'
  )

  return {
    completedBlock: null,
    nextBlock: started,
    reason,
  }
}

export function completeAndAdvance(
  db: Database.Database,
  blockId: number,
  options?: { endTime?: string; reason?: BlockProgressionReason }
): BlockProgressionResult {
  const block = getBlockById(db, blockId)
  if (!block) {
    throw new Error('BLOCK_NOT_FOUND')
  }

  const reason = options?.reason ?? 'manual_completed'
  const completed = completeBlock(db, blockId, { endTime: options?.endTime })
  const progressionNowMs = options?.endTime
    ? new Date(options.endTime).getTime()
    : Date.now()
  const progression = advanceToNextBlock(
    db,
    block.schedule_date,
    completed.title,
    reason,
    progressionNowMs
  )

  return {
    completedBlock: completed,
    nextBlock: progression.nextBlock,
    reason,
  }
}

export function skipBlock(db: Database.Database, blockId: number): BlockProgressionResult {
  const block = getBlockById(db, blockId)
  if (!block) {
    throw new Error('BLOCK_NOT_FOUND')
  }

  if (block.status !== 'active') {
    throw new Error('BLOCK_NOT_ACTIVE')
  }

  const protectedTemplates = listProtectedBlocks(db)
  if (!isBlockSkippable(block, protectedTemplates)) {
    throw new Error('BLOCK_NOT_SKIPPABLE')
  }

  const now = nowIso()
  const nowMs = Date.now()
  const reclaimMinutes = computeReclaimMinutes(block.planned_end, nowMs)

  let actualDuration = block.planned_duration_minutes
  if (block.actual_start) {
    const startMs = new Date(block.actual_start).getTime()
    const endMs = new Date(now).getTime()
    actualDuration = Math.max(1, Math.round((endMs - startMs) / 60_000))
  }

  const skipped = updateBlock(db, blockId, {
    status: 'skipped',
    actual_end: now,
    actual_duration_minutes: actualDuration,
  })

  if (!skipped) {
    throw new Error('BLOCK_UPDATE_FAILED')
  }

  if (reclaimMinutes > 0) {
    shiftSubsequentBlocks(db, block.schedule_date, block.priority_order, -reclaimMinutes)
  }

  resetBlockNotificationState()
  resetPauseTracking()

  const next = findNextPlannedBlock(db, block.schedule_date)
  if (!next) {
    postProgressionMessage(db, formatSkipMessage(skipped.title, null), 'end_of_day', 'block_skipped')
    return {
      completedBlock: skipped,
      nextBlock: null,
      reason: 'skipped',
    }
  }

  const started = tryStartNextDueBlock(db, block.schedule_date, nowMs)
  postProgressionMessage(
    db,
    formatSkipMessage(skipped.title, next.title, {
      nextStartsAt: started ? undefined : formatBlockStartTime(next.planned_start),
    }),
    'skip_confirmed',
    'block_skipped'
  )

  return {
    completedBlock: skipped,
    nextBlock: started,
    reason: 'skipped',
  }
}

export function extendActiveBlock(
  db: Database.Database,
  blockId: number,
  minutes = 5
): DailyScheduleRow {
  const block = getBlockById(db, blockId)
  if (!block) {
    throw new Error('BLOCK_NOT_FOUND')
  }

  if (block.status !== 'active') {
    throw new Error('BLOCK_NOT_ACTIVE')
  }

  const extendedEnd = shiftIsoByMinutes(block.planned_end, minutes)
  const extendedDuration = block.planned_duration_minutes + minutes

  const updated = updateBlock(db, blockId, {
    planned_end: extendedEnd,
    planned_duration_minutes: extendedDuration,
  })

  if (!updated) {
    throw new Error('BLOCK_UPDATE_FAILED')
  }

  shiftSubsequentBlocks(db, block.schedule_date, block.priority_order, minutes)
  resetBlockNotificationState()

  postProgressionMessage(db, formatExtendMessage(updated.title, minutes), 'extend_confirmed', 'block_complete')

  return updated
}

export function autoCompleteAndAdvance(
  db: Database.Database,
  scheduleDate: string,
  nowMs = Date.now()
): BlockProgressionResult | null {
  if (isWorkPaused()) {
    return null
  }

  const activeBlock = getActiveBlock(db, scheduleDate)
  if (!activeBlock || !shouldAutoCompleteBlock(activeBlock, nowMs)) {
    return null
  }

  const endTime = activeBlock.planned_end
  return completeAndAdvance(db, activeBlock.id, {
    endTime,
    reason: 'auto_completed',
  })
}
