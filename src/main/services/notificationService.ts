import type { BrowserWindow } from 'electron'
import type Database from 'better-sqlite3'
import type {
  ActiveNotificationSummary,
  NotificationActionResponse,
  NotificationDispatchedPayload,
  NotifyPayload,
} from '@shared/types/notifications'
import { getDatabase } from '../db/connection'
import { getAllSettings } from '../db/repositories/appSettingsRepository'
import {
  acknowledgeNotification,
  insertNotification,
} from '../db/repositories/notificationsLogRepository'
import { routeNotificationAction } from './notificationActionRouter'
import { setDesktopNotificationWindow, showDesktopNotification } from './desktopNotification'

interface ActiveNotificationEntry extends ActiveNotificationSummary {}

let mainWindow: BrowserWindow | null = null
const activeByDedupeKey = new Map<string, ActiveNotificationEntry>()
const recentById = new Map<number, ActiveNotificationEntry>()

function emitEvent(channel: string, payload: unknown): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  mainWindow.webContents.send(channel, payload)
}

function emitStateChanged(): void {
  emitEvent('notification:state-changed', {
    active: getActiveNotifications(),
  })
}

function toSummary(
  id: number,
  payload: NotifyPayload,
  createdAt: string
): ActiveNotificationEntry {
  return {
    id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    urgency: payload.urgency,
    persistent: payload.persistent,
    dedupeKey: payload.dedupeKey,
    actions: payload.actions ?? [],
    metadata: payload.metadata ?? {},
    createdAt,
  }
}

export function setNotificationWindow(window: BrowserWindow | null): void {
  mainWindow = window
  setDesktopNotificationWindow(window, () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

export function getActiveNotifications(): ActiveNotificationSummary[] {
  return Array.from(activeByDedupeKey.values())
    .filter((entry) => entry.persistent)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
}

export function notify(payload: NotifyPayload, db?: Database.Database): number {
  const showInChat = payload.showInChat !== false
  const database = db ?? getDatabase()

  if (payload.persistent) {
    const existing = activeByDedupeKey.get(payload.dedupeKey)
    if (existing) {
      const dispatched: NotificationDispatchedPayload = {
        ...existing,
        showInChat: false,
        skippedDuplicate: true,
      }
      emitEvent('notification:dispatched', dispatched)
      return existing.id
    }
  }

  const createdAt = new Date().toISOString()
  const row = insertNotification(database, {
    type: payload.type,
    title: payload.title,
    message: payload.message,
    urgency: payload.urgency,
    created_at: createdAt,
  })

  const summary = toSummary(row.id, payload, createdAt)
  recentById.set(row.id, summary)

  if (payload.persistent) {
    activeByDedupeKey.set(payload.dedupeKey, summary)
    emitStateChanged()
  }

  const settings = getAllSettings(database)
  showDesktopNotification({
    title: payload.title,
    body: payload.message,
    type: payload.type,
    notifications: settings.notifications,
  })

  const dispatched: NotificationDispatchedPayload = {
    ...summary,
    showInChat,
    skippedDuplicate: false,
  }
  emitEvent('notification:dispatched', dispatched)

  return row.id
}

export function acknowledgeNotificationByDedupeKey(dedupeKey: string): void {
  const active = activeByDedupeKey.get(dedupeKey)
  if (!active) {
    return
  }

  const acknowledgedAt = new Date().toISOString()
  acknowledgeNotification(getDatabase(), active.id, acknowledgedAt)
  activeByDedupeKey.delete(dedupeKey)
  recentById.delete(active.id)
  emitStateChanged()
  emitEvent('notification:acknowledged', { notificationId: active.id })
}

function acknowledgeNotificationById(notificationId: number): ActiveNotificationEntry | null {
  const target = recentById.get(notificationId) ?? null

  const acknowledgedAt = new Date().toISOString()
  acknowledgeNotification(getDatabase(), notificationId, acknowledgedAt)
  recentById.delete(notificationId)

  if (target) {
    activeByDedupeKey.delete(target.dedupeKey)
    emitStateChanged()
  }

  emitEvent('notification:acknowledged', { notificationId })
  return target
}

export function performNotificationAction(
  notificationId: number,
  actionId: string
): NotificationActionResponse {
  const activeEntry = recentById.get(notificationId)

  if (!activeEntry) {
    throw new Error('NOTIFICATION_NOT_FOUND')
  }

  const result = routeNotificationAction({
    type: activeEntry.type,
    actionId,
    metadata: activeEntry.metadata,
  })

  if (result.acknowledged) {
    acknowledgeNotificationById(notificationId)
  }

  return result
}

export function resetNotificationServiceForTests(): void {
  mainWindow = null
  activeByDedupeKey.clear()
  recentById.clear()
}

export function getActiveByDedupeKeyForTests(): Map<string, ActiveNotificationEntry> {
  return activeByDedupeKey
}
