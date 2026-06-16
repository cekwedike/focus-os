import type { BrowserWindow } from 'electron'
import { listStaleClients } from '@shared/insights/stalenessSnapshot'
import { STALENESS_GOT_IT_ACTION } from '@shared/notifications/notificationActions'
import { getDatabase } from '../db/connection'
import { listClients } from '../db/repositories/clientsRepository'
import { getAllSettings } from '../db/repositories/appSettingsRepository'
import { notify } from './notificationService'

let checkInterval: ReturnType<typeof setInterval> | null = null
let mainWindow: BrowserWindow | null = null
const alertedClients = new Set<number>()

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function checkStaleness(): void {
  if (!mainWindow) {
    return
  }

  const settings = getAllSettings(getDatabase())
  if (!settings.notifications.staleness) {
    return
  }

  const staleClients = listStaleClients(listClients(getDatabase()), {
    defaultStalenessHours: settings.defaultStalenessHours,
  })

  const sessionDate = todayDateString()

  for (const client of staleClients) {
    if (!alertedClients.has(client.clientId)) {
      notify({
        type: 'staleness_alert',
        title: 'Client Staleness',
        message: `${client.clientName} has not been touched in ${Math.round(client.hoursSinceTouch)} hours.`,
        urgency: 'normal',
        persistent: false,
        dedupeKey: `staleness:${client.clientId}:${sessionDate}`,
        actions: [STALENESS_GOT_IT_ACTION],
        metadata: { clientId: client.clientId, clientName: client.clientName },
      })
      alertedClients.add(client.clientId)
    }
  }
}

export function startStalenessService(window: BrowserWindow): void {
  mainWindow = window
  if (checkInterval) {
    return
  }

  checkInterval = setInterval(checkStaleness, 5 * 60 * 1000)
  checkStaleness()
}

export function stopStalenessService(): void {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
  mainWindow = null
  alertedClients.clear()
}

export function clearStalenessAlert(clientId: number): void {
  alertedClients.delete(clientId)
}
