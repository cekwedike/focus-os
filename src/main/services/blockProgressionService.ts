import type Database from 'better-sqlite3'
import type { DailyScheduleRow } from '@shared/types/db'
import type { BlockProgressionReason } from '@shared/schedule/blockProgressionMessages'
import {
  formatAutoProgressionMessage,
  formatExtendMessage,
  formatSkipMessage,
} from '@shared/schedule/blockProgressionMessages'
import { isBlockSkippable } from '@shared/schedule/blockSkippable'
import {
  computeReclaimMinutes,
  shiftIsoByMinutes,
} from '@shared/schedule/blockTimeShift'
import { resolveContextualChips } from '@shared/chat/contextualChips'
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
import { emitAssistantMessage } from './chatAssistantBridge'
import { resetBlockNotificationState } from './blockNotificationService'
import { resetPauseTracking, isWorkPaused } from './workPauseService'

import type { BlockProgressionResult } from '@shared/types/schedule'

export function activateFirstBlockIfNone(
  db: Database.Database,
  scheduleDate: string
): DailyScheduleRow | null {
  const active = getActiveBlock(db, scheduleDate)
  if (active) {
    return active
  }

  const next = findNextPlannedBlock(db, scheduleDate)
  if (!next) {
    return null
  }

  return startBlock(db, next.id)
}

function postProgressionMessage(
  text: string,
  chipContext:
    | 'auto_progression'
    | 'manual_complete'
    | 'extend_confirmed'
    | 'skip_confirmed'
    | 'end_of_day'
): void {
  emitAssistantMessage({
    text,
    quickReplies: resolveContextualChips(chipContext),
    chipContext,
  })
}

export function advanceToNextBlock(
  db: Database.Database,
  scheduleDate: string,
  completedTitle: string,
  reason: BlockProgressionReason
): BlockProgressionResult {
  const next = findNextPlannedBlock(db, scheduleDate)
  resetBlockNotificationState()
  resetPauseTracking()

  if (!next) {
    postProgressionMessage(
      formatAutoProgressionMessage(completedTitle, null),
      reason === 'manual_completed' ? 'manual_complete' : 'end_of_day'
    )

    return {
      completedBlock: null,
      nextBlock: null,
      reason,
    }
  }

  const started = startBlock(db, next.id)
  postProgressionMessage(
    formatAutoProgressionMessage(completedTitle, started.title),
    reason === 'manual_completed' ? 'manual_complete' : 'auto_progression'
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
  const progression = advanceToNextBlock(db, block.schedule_date, completed.title, reason)

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
    postProgressionMessage(formatSkipMessage(skipped.title, null), 'end_of_day')
    return {
      completedBlock: skipped,
      nextBlock: null,
      reason: 'skipped',
    }
  }

  const started = startBlock(db, next.id)
  postProgressionMessage(formatSkipMessage(skipped.title, started.title), 'skip_confirmed')

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

  postProgressionMessage(formatExtendMessage(updated.title, minutes), 'extend_confirmed')

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
