import { Notification } from 'electron'
import { getDatabase } from '../db/connection'
import { getAllSettings } from '../db/repositories/appSettingsRepository'

export interface DesktopNotificationInput {
  title: string
  body: string
  category: 'microBreak' | 'staleness' | 'insightReady' | 'clientReminder' | 'blockReminder'
}

function isCategoryEnabled(category: DesktopNotificationInput['category']): boolean {
  const settings = getAllSettings(getDatabase())
  return settings.notifications[category] !== false
}

export function showDesktopNotification(input: DesktopNotificationInput): void {
  if (!Notification.isSupported()) {
    return
  }

  if (!isCategoryEnabled(input.category)) {
    return
  }

  const notification = new Notification({
    title: input.title,
    body: input.body,
    silent: false,
  })

  notification.show()
}
