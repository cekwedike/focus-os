import type { BrowserWindow } from 'electron'
import { getDatabase } from '../db/connection'
import { getClientById } from '../db/repositories/clientsRepository'
import { getActiveBlock } from '../db/repositories/dailyScheduleRepository'
import { getActiveLongBreak } from '../db/repositories/breaksLogRepository'
import {
  resolveClientReminderTick,
  type ClientReminderState,
} from '@shared/reminders/clientReminderLogic'
import { showDesktopNotification } from './notificationService'
import { isWorkPaused } from './workPauseService'

let tickInterval: ReturnType<typeof setInterval> | null = null
let mainWindow: BrowserWindow | null = null
let reminderState: ClientReminderState = { activeBlockId: null, elapsedSeconds: 0 }

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function isLongBreakActive(): boolean {
  return getActiveLongBreak(getDatabase(), todayDateString()) !== null
}

function emitAssistantMessage(text: string): void {
  if (mainWindow) {
    mainWindow.webContents.send('chat:assistant-message', { text })
  }

  const windowHidden = !mainWindow || !mainWindow.isVisible() || !mainWindow.isFocused()
  if (windowHidden) {
    showDesktopNotification({
      title: 'Focus OS',
      body: text,
      category: 'clientReminder',
    })
  }
}

function tickClientReminder(): void {
  if (!mainWindow) {
    return
  }

  const activeBlock = getActiveBlock(getDatabase(), todayDateString())
  const activeBlockId = activeBlock?.id ?? null
  const clientRow =
    activeBlock?.client_id != null ? getClientById(getDatabase(), activeBlock.client_id) : null

  const result = resolveClientReminderTick({
    state: reminderState,
    activeBlockId,
    client: clientRow
      ? {
          reminderEnabled: clientRow.reminder_enabled === 1,
          reminderIntervalMinutes: clientRow.reminder_interval_minutes ?? 0,
          reminderLabel: clientRow.reminder_label,
          clientName: clientRow.name,
        }
      : null,
    workPaused: isWorkPaused(),
    longBreakActive: isLongBreakActive(),
  })

  reminderState = result.nextState

  if (result.shouldFire && result.message) {
    emitAssistantMessage(result.message)
  }
}

export function startClientReminderService(window: BrowserWindow): void {
  mainWindow = window
  if (tickInterval) {
    return
  }

  tickInterval = setInterval(tickClientReminder, 1000)
}

export function stopClientReminderService(): void {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
  mainWindow = null
  reminderState = { activeBlockId: null, elapsedSeconds: 0 }
}

export function resetClientReminderState(): void {
  reminderState = { activeBlockId: null, elapsedSeconds: 0 }
}
