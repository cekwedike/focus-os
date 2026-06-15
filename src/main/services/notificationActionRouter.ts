import type { NotificationActionResponse } from '@shared/types/notifications'
import { getDatabase } from '../db/connection'
import { createBreak } from '../db/repositories/breaksLogRepository'
import { acknowledgeCheckIn } from './checkInService'
import { completeAndAdvance, extendActiveBlock } from './blockProgressionService'
import { resetMicroBreakAccumulator } from './timerService'
import { emitAppNavigate } from './appNavigateBridge'

const MICRO_ACTIVITY_MINUTES: Record<string, number> = {
  read: 10,
  walk: 15,
  call: 10,
  messages: 10,
  doomscroll: 5,
  skip: 0,
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function logMicroBreakActivity(activity: string): void {
  const db = getDatabase()
  const planned = MICRO_ACTIVITY_MINUTES[activity] ?? 10
  createBreak(db, {
    break_date: todayDateString(),
    break_type: 'micro',
    started_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
    duration_minutes: planned,
    activity,
    reason: activity === 'skip' ? 'Skipped micro-break' : null,
  })
  resetMicroBreakAccumulator()
}

function getMetadataNumber(metadata: Record<string, unknown>, key: string): number | null {
  const value = metadata[key]
  return typeof value === 'number' ? value : null
}

export function routeNotificationAction(input: {
  type: string
  actionId: string
  metadata: Record<string, unknown>
}): NotificationActionResponse {
  const { type, actionId, metadata } = input

  if (type === 'check_in_due' && actionId === 'check_in.done') {
    const clientId = getMetadataNumber(metadata, 'clientId')
    if (clientId === null) {
      throw new Error('CHECK_IN_CLIENT_ID_MISSING')
    }
    acknowledgeCheckIn(clientId)
    return { acknowledged: true }
  }

  if (type === 'micro_break' && actionId.startsWith('micro_break.')) {
    const activity = actionId.replace('micro_break.', '')
    if (!(activity in MICRO_ACTIVITY_MINUTES)) {
      throw new Error('UNKNOWN_MICRO_BREAK_ACTIVITY')
    }
    logMicroBreakActivity(activity)
    return { acknowledged: true }
  }

  if (type === 'block_warning') {
    const blockId = getMetadataNumber(metadata, 'blockId')
    if (blockId === null) {
      throw new Error('BLOCK_ID_MISSING')
    }

    if (actionId === 'block.extend_5') {
      extendActiveBlock(getDatabase(), blockId, 5)
      return { acknowledged: true }
    }

    if (actionId === 'block.done_early') {
      completeAndAdvance(getDatabase(), blockId, { reason: 'manual_completed' })
      return { acknowledged: true }
    }

    if (actionId === 'block.got_it') {
      return { acknowledged: true }
    }
  }

  if (type === 'faith_reminder') {
    if (actionId === 'faith.log') {
      emitAppNavigate('/journal')
      return { acknowledged: true, navigate: '/journal' }
    }

    if (actionId === 'faith.got_it') {
      return { acknowledged: true }
    }
  }

  if (type === 'staleness_alert' && actionId === 'staleness.got_it') {
    return { acknowledged: true }
  }

  if (
    (type === 'block_complete' || type === 'block_skipped') &&
    actionId.startsWith('intent.')
  ) {
    const sendText = metadata.sendTextByActionId
    if (sendText && typeof sendText === 'object') {
      const text = (sendText as Record<string, string>)[actionId]
      if (text) {
        return { acknowledged: true, sendText: text }
      }
    }
  }

  throw new Error(`UNKNOWN_NOTIFICATION_ACTION:${type}:${actionId}`)
}
