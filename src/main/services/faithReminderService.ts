import type { BrowserWindow } from 'electron'
import { getDatabase } from '../db/connection'
import { getActiveBlock } from '../db/repositories/dailyScheduleRepository'
import { getFaithEntryByDate } from '../db/repositories/faithLogRepository'
import { notify } from './notificationService'
import { FAITH_REMINDER_ACTIONS } from '@shared/notifications/notificationActions'

let mainWindow: BrowserWindow | null = null
let remindedToday: string | null = null

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function hasFaithEntryToday(): boolean {
  const entry = getFaithEntryByDate(getDatabase(), todayDateString())
  if (!entry) {
    return false
  }

  const hasBible = Boolean(entry.bible_reference?.trim())
  const hasPrayer = Boolean(entry.prayer_notes?.trim())
  return hasBible || hasPrayer
}

function isFaithBlockActive(): boolean {
  const activeBlock = getActiveBlock(getDatabase(), todayDateString())
  return (
    activeBlock?.status === 'active' &&
    activeBlock.block_type === 'protected' &&
    activeBlock.protected_subtype === 'faith'
  )
}

export function tickFaithReminder(): void {
  if (!mainWindow) {
    return
  }

  const today = todayDateString()

  if (!isFaithBlockActive()) {
    remindedToday = null
    return
  }

  if (hasFaithEntryToday()) {
    remindedToday = today
    return
  }

  if (remindedToday === today) {
    return
  }

  notify({
    type: 'faith_reminder',
    title: 'Faith Block',
    message: 'Time for Bible reading and prayer. Log your faith time when ready.',
    urgency: 'normal',
    persistent: true,
    dedupeKey: `faith_reminder:${today}`,
    actions: FAITH_REMINDER_ACTIONS,
  })

  remindedToday = today
}

export function startFaithReminderService(window: BrowserWindow): void {
  mainWindow = window
}

export function stopFaithReminderService(): void {
  mainWindow = null
  remindedToday = null
}

export function resetFaithReminderStateForTests(): void {
  remindedToday = null
  mainWindow = null
}
