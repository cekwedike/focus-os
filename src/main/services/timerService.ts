import type { BrowserWindow } from 'electron'
import { getDatabase } from '../db/connection'
import { getActiveBlock } from '../db/repositories/dailyScheduleRepository'
import { getActiveLongBreak } from '../db/repositories/breaksLogRepository'
import { getAllSettings } from '../db/repositories/appSettingsRepository'
import { MICRO_BREAK_NOTIFICATION_ACTIONS } from '@shared/notifications/notificationActions'
import { autoCompleteAndAdvance } from './blockProgressionService'
import { tickBlockNotifications } from './blockNotificationService'
import { tickFaithReminder } from './faithReminderService'
import { notify } from './notificationService'
import { isWorkPaused } from './workPauseService'

let activeWorkSeconds = 0
let tickInterval: ReturnType<typeof setInterval> | null = null
let mainWindow: BrowserWindow | null = null

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function getIntervalMinutes(): number {
  return getAllSettings(getDatabase()).microBreakIntervalMinutes
}

function isLongBreakActive(): boolean {
  return getActiveLongBreak(getDatabase(), todayDateString()) !== null
}

function emitScheduleBlockChanged(payload: {
  scheduleDate: string
  blockId: number
  nextBlockId: number | null
  reason: 'auto_completed' | 'manual_completed' | 'skipped' | 'extended'
}): void {
  if (mainWindow) {
    mainWindow.webContents.send('schedule:block-changed', payload)
  }
}

function tickAutoComplete(): void {
  if (isWorkPaused()) {
    return
  }

  const scheduleDate = todayDateString()
  const db = getDatabase()
  const activeBlock = getActiveBlock(db, scheduleDate)

  if (activeBlock) {
    tickBlockNotifications(activeBlock)
  }

  const result = autoCompleteAndAdvance(db, scheduleDate)
  if (!result?.completedBlock) {
    return
  }

  activeWorkSeconds = 0
  emitScheduleBlockChanged({
    scheduleDate,
    blockId: result.completedBlock.id,
    nextBlockId: result.nextBlock?.id ?? null,
    reason: 'auto_completed',
  })
}

function emitMicroBreakDue(): void {
  if (!mainWindow || isLongBreakActive()) {
    return
  }

  notify({
    type: 'micro_break',
    title: 'Micro-Break Time',
    message: 'Pick a short activity for your break.',
    urgency: 'normal',
    persistent: false,
    dedupeKey: `micro_break:${Date.now()}`,
    actions: MICRO_BREAK_NOTIFICATION_ACTIONS,
  })
  activeWorkSeconds = 0
}

function tickActiveWork(): void {
  if (!mainWindow || isLongBreakActive() || isWorkPaused()) {
    return
  }

  const activeBlock = getActiveBlock(getDatabase(), todayDateString())
  if (!activeBlock) {
    return
  }

  activeWorkSeconds += 1
  const thresholdSeconds = getIntervalMinutes() * 60
  if (activeWorkSeconds >= thresholdSeconds) {
    emitMicroBreakDue()
  }
}

function tick(): void {
  if (!mainWindow) {
    return
  }

  tickAutoComplete()
  tickActiveWork()
  tickFaithReminder()
}

export function startTimerService(window: BrowserWindow): void {
  mainWindow = window
  if (tickInterval) {
    return
  }

  tick()
  tickInterval = setInterval(tick, 1000)
}

export function stopTimerService(): void {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
  mainWindow = null
}

export function resetMicroBreakAccumulator(): void {
  activeWorkSeconds = 0
}
