import type { BrowserWindow } from 'electron'
import { getDatabase } from '../db/connection'
import { getActiveBlock } from '../db/repositories/dailyScheduleRepository'
import { getActiveLongBreak } from '../db/repositories/breaksLogRepository'
import { getAllSettings } from '../db/repositories/appSettingsRepository'
import { autoCompleteActiveBlockIfDue } from './scheduleService'

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
  reason: 'auto_completed'
}): void {
  if (mainWindow) {
    mainWindow.webContents.send('schedule:block-changed', payload)
  }
}

function tickAutoComplete(): void {
  const scheduleDate = todayDateString()
  const completed = autoCompleteActiveBlockIfDue(getDatabase(), scheduleDate)
  if (!completed) {
    return
  }

  activeWorkSeconds = 0
  emitScheduleBlockChanged({
    scheduleDate,
    blockId: completed.id,
    reason: 'auto_completed',
  })
}

function emitMicroBreakDue(): void {
  if (!mainWindow || isLongBreakActive()) {
    return
  }

  mainWindow.webContents.send('break:micro-break-due', {
    suggestedActivities: ['read', 'walk', 'call', 'messages', 'doomscroll', 'skip'],
  })
  activeWorkSeconds = 0
}

function tickActiveWork(): void {
  if (!mainWindow || isLongBreakActive()) {
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
