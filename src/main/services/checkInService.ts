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
  formatDueBannerText,
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
import { CHECK_IN_DONE_ACTION } from '@shared/notifications/notificationActions'
import { acknowledgeNotificationByDedupeKey, notify } from './notificationService'

let tickInterval: ReturnType<typeof setInterval> | null = null
let mainWindow: BrowserWindow | null = null
const runtimeStates = new Map<number, CheckInRuntimeState>()
const clientConfigs = new Map<number, CheckInClientConfig>()

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
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

    if (result.becameDue && result.dueEntry) {
      const label = displayReminderLabel(config.reminderLabel)
      if (!result.nextState.notifiedDue) {
        const { title } = formatDueBannerText(label, config.clientName, 0)
        notify({
          type: 'check_in_due',
          title,
          message: formatCheckInDueChatMessage(label, config.clientName),
          urgency: 'high',
          persistent: true,
          dedupeKey: `check_in:${clientId}:${config.checkInDate}`,
          actions: [CHECK_IN_DONE_ACTION],
          metadata: { clientId },
        })
        runtimeStates.set(clientId, {
          ...result.nextState,
          notifiedDue: true,
        })
      }
    }

    if (
      previous &&
      (previous.phase !== result.nextState.phase || previous.dueAtMs !== result.nextState.dueAtMs)
    ) {
      // phase transition tracked in runtime state only
    }
  }

  for (const clientId of runtimeStates.keys()) {
    if (!configs.has(clientId)) {
      runtimeStates.delete(clientId)
    }
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
  acknowledgeNotificationByDedupeKey(`check_in:${clientId}:${config.checkInDate}`)
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
