import { Notification, nativeImage, type BrowserWindow } from 'electron'
import type { NotificationPreferences } from '@shared/types/settings'
import type { NotificationType } from '@shared/types/notifications'
import { resolveAppIconPath } from '../utils/appIcon'

let unsupportedLogged = false
let mainWindow: BrowserWindow | null = null
let focusWindow: (() => void) | null = null

export function setDesktopNotificationWindow(
  window: BrowserWindow | null,
  onFocus: () => void
): void {
  mainWindow = window
  focusWindow = onFocus
}

function resolveNotificationIcon(): Electron.NativeImage | undefined {
  const iconPath = resolveAppIconPath()
  if (!iconPath) {
    return undefined
  }

  return nativeImage.createFromPath(iconPath)
}

export function mapNotificationTypeToCategory(
  type: NotificationType
): keyof NotificationPreferences | null {
  switch (type) {
    case 'micro_break':
      return 'microBreak'
    case 'check_in_due':
      return 'clientReminder'
    case 'block_warning':
    case 'block_complete':
    case 'block_skipped':
    case 'faith_reminder':
      return 'blockReminder'
    case 'staleness_alert':
      return 'staleness'
    case 'generic':
      return null
    default:
      return null
  }
}

export function isDesktopCategoryEnabled(
  type: NotificationType,
  notifications: NotificationPreferences
): boolean {
  const category = mapNotificationTypeToCategory(type)
  if (category === null) {
    return true
  }

  return notifications[category] !== false
}

export function showDesktopNotification(input: {
  title: string
  body: string
  type: NotificationType
  notifications: NotificationPreferences
}): void {
  if (typeof Notification === 'undefined' || !Notification.isSupported()) {
    if (!unsupportedLogged) {
      console.warn('[notificationService] Desktop notifications are not supported on this platform.')
      unsupportedLogged = true
    }
    return
  }

  if (!isDesktopCategoryEnabled(input.type, input.notifications)) {
    return
  }

  const icon = resolveNotificationIcon()
  const notification = new Notification({
    title: input.title,
    body: input.body,
    silent: false,
    icon: icon ?? undefined,
  })

  notification.on('click', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
      mainWindow.focus()
      focusWindow?.()
      return
    }

    focusWindow?.()
  })

  notification.show()
}

export function resetDesktopNotificationTestState(): void {
  unsupportedLogged = false
  mainWindow = null
  focusWindow = null
}
