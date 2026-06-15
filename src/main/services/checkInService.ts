import type { BrowserWindow } from 'electron'
import type { ClientProjectRow } from '@shared/types/db'
import { getDatabase } from '../db/connection'
import { listClients } from '../db/repositories/clientsRepository'
import {
  computeActualIntervalMinutes,
  getLastCheckInForDate,
  insertCheckIn,
} from '../db/repositories/checkInsRepository'
import { getDailySettings } from '../db/repositories/dailySettingsRepository'
import {
  displayReminderLabel,
  formatCheckInDueChatMessage,
  formatCheckInNotificationBody,
  listDueEntries,
  resolveAcknowledgedState,
  resolveCheckInTick,
  type CheckInClientConfig,
  type CheckInRuntimeState,
  type DueCheckInEntry,
} from '@shared/reminders/checkInCountdownLogic'
import {
  isWithinWindow,
  parseFixedBlockOverrides,
  resolveClientFixedBlockWindow,
} from '@shared/reminders/fixedBlockWindow'
import { showDesktopNotification } from './notificationService'

let tickInterval: ReturnType<typeof setInterval> | null = null
let mainWindow: BrowserWindow | null = null
const runtimeStates = new Map<number, CheckInRuntimeState>()
const clientConfigs = new Map<number, CheckInClientConfig>()

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function emitStateChanged(): void {
  if (mainWindow) {
    mainWindow.webContents.send('check-in:state-changed', {
      due: getDueCheckIns(),
    })
  }
}

function emitAssistantMessage(text: string): void {
  if (mainWindow) {
    mainWindow.webContents.send('chat:assistant-message', { text })
  }
}

function buildClientConfig(
  client: ClientProjectRow,
  scheduleDate: string,
  overrides: ReturnType<typeof parseFixedBlockOverrides>
): CheckInClientConfig | null {
  const window = resolveClientFixedBlockWindow(scheduleDate, client, overrides)
  if (!window || client.reminder_enabled !== 1) {
    return null
  }

  const interval = client.reminder_interval_minutes ?? 0
  if (interval <= 0) {
    return null
  }

  return {
    clientId: client.id,
    clientName: client.name,
    reminderLabel: client.reminder_label,
    reminderIntervalMinutes: interval,
    windowStartMs: window.windowStart.getTime(),
    windowEndMs: window.windowEnd.getTime(),
    checkInDate: window.scheduleDate,
  }
}

function loadEligibleConfigs(scheduleDate: string): Map<number, CheckInClientConfig> {
  const db = getDatabase()
  const daily = getDailySettings(db, scheduleDate)
  const overrides = parseFixedBlockOverrides(daily?.notes ?? null)
  const configs = new Map<number, CheckInClientConfig>()

  for (const client of listClients(db)) {
    if (client.is_active !== 1) {
      continue
    }
    const config = buildClientConfig(client, scheduleDate, overrides)
    if (config) {
      configs.set(client.id, config)
    }
  }

  return configs
}

function tickCheckIns(): void {
  if (!mainWindow) {
    return
  }

  const db = getDatabase()
  const scheduleDate = todayDateString()
  const now = new Date()
  const nowMs = now.getTime()
  const configs = loadEligibleConfigs(scheduleDate)
  clientConfigs.clear()
  for (const [clientId, config] of configs) {
    clientConfigs.set(clientId, config)
  }

  let stateChanged = false

  for (const [clientId, config] of configs) {
    const window = {
      scheduleDate: config.checkInDate,
      windowStart: new Date(config.windowStartMs),
      windowEnd: new Date(config.windowEndMs),
    }
    const inWindow = isWithinWindow(now, window)
    const lastCheckIn = getLastCheckInForDate(db, clientId, config.checkInDate)
    const lastAckMs = lastCheckIn ? new Date(lastCheckIn.acknowledged_at).getTime() : null

    const result = resolveCheckInTick({
      config,
      state: runtimeStates.get(clientId) ?? null,
      nowMs,
      lastAcknowledgedAtMs: lastAckMs,
      inWindow,
    })

    const previous = runtimeStates.get(clientId)
    runtimeStates.set(clientId, result.nextState)

    if (
      !previous ||
      previous.phase !== result.nextState.phase ||
      previous.dueAtMs !== result.nextState.dueAtMs
    ) {
      stateChanged = true
    }

    if (result.becameDue && result.dueEntry) {
      const label = displayReminderLabel(config.reminderLabel)
      if (!result.nextState.notifiedDue) {
        emitAssistantMessage(formatCheckInDueChatMessage(label, config.clientName))
        showDesktopNotification({
          title: 'Focus OS',
          body: formatCheckInNotificationBody(label, config.clientName),
          category: 'clientReminder',
        })
        runtimeStates.set(clientId, {
          ...result.nextState,
          notifiedDue: true,
        })
        stateChanged = true
      }
    }
  }

  for (const clientId of runtimeStates.keys()) {
    if (!configs.has(clientId)) {
      runtimeStates.delete(clientId)
      stateChanged = true
    }
  }

  if (stateChanged) {
    emitStateChanged()
  }
}

export function getDueCheckIns(): DueCheckInEntry[] {
  return listDueEntries(runtimeStates, clientConfigs, Date.now())
}

export function acknowledgeCheckIn(clientId: number): DueCheckInEntry | null {
  const db = getDatabase()
  const scheduleDate = todayDateString()
  const configs = loadEligibleConfigs(scheduleDate)
  const config = configs.get(clientId)
  const state = runtimeStates.get(clientId)

  if (!config || !state || state.phase !== 'due' || state.dueAtMs === null) {
    return null
  }

  const acknowledgedAt = new Date().toISOString()
  const scheduledAt = new Date(state.dueAtMs).toISOString()
  const previous = getLastCheckInForDate(db, clientId, config.checkInDate)
  const actualIntervalMinutes = computeActualIntervalMinutes(
    acknowledgedAt,
    previous?.acknowledged_at ?? null
  )

  insertCheckIn(db, {
    client_project_id: clientId,
    check_in_date: config.checkInDate,
    scheduled_at: scheduledAt,
    acknowledged_at: acknowledgedAt,
    actual_interval_minutes: actualIntervalMinutes,
  })

  const nextState = resolveAcknowledgedState({
    config,
    nowMs: Date.now(),
  })
  runtimeStates.set(clientId, nextState)
  clientConfigs.set(clientId, config)
  emitStateChanged()
  return null
}

export function startCheckInService(window: BrowserWindow): void {
  mainWindow = window
  if (tickInterval) {
    return
  }

  tickCheckIns()
  tickInterval = setInterval(tickCheckIns, 1000)
}

export function stopCheckInService(): void {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
  mainWindow = null
  runtimeStates.clear()
  clientConfigs.clear()
}
