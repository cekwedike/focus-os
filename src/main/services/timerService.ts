import type { BrowserWindow } from 'electron'
import { getDatabase } from '../db/connection'
import { getActiveBlock } from '../db/repositories/dailyScheduleRepository'
import { getActiveLongBreak } from '../db/repositories/breaksLogRepository'
import { getAllSettings } from '../db/repositories/appSettingsRepository'

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

export function startTimerService(window: BrowserWindow): void {
  mainWindow = window
  if (tickInterval) {
    return
  }

  tickInterval = setInterval(tickActiveWork, 1000)
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
