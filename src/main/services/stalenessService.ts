import type { BrowserWindow } from 'electron'
import { isSystemUnassignedClient } from '@shared/constants/systemClient'
import { getDatabase } from '../db/connection'
import { listClients } from '../db/repositories/clientsRepository'
import { getAllSettings } from '../db/repositories/appSettingsRepository'

let checkInterval: ReturnType<typeof setInterval> | null = null
let mainWindow: BrowserWindow | null = null
const alertedClients = new Set<number>()

function checkStaleness(): void {
  if (!mainWindow) {
    return
  }

  const settings = getAllSettings(getDatabase())
  const thresholdHours = settings.defaultStalenessHours
  const now = Date.now()

  for (const client of listClients(getDatabase())) {
    if (client.is_active !== 1 || isSystemUnassignedClient(client.name)) {
      continue
    }

    const threshold = client.staleness_threshold_hours ?? thresholdHours
    if (!client.last_touched_at) {
      if (!alertedClients.has(client.id)) {
        mainWindow.webContents.send('staleness:alert', {
          clientId: client.id,
          clientName: client.name,
          hoursSinceTouch: threshold + 1,
        })
        alertedClients.add(client.id)
      }
      continue
    }

    const hoursSince =
      (now - new Date(client.last_touched_at).getTime()) / (60 * 60 * 1000)

    if (hoursSince >= threshold && !alertedClients.has(client.id)) {
      mainWindow.webContents.send('staleness:alert', {
        clientId: client.id,
        clientName: client.name,
        hoursSinceTouch: Math.round(hoursSince),
      })
      alertedClients.add(client.id)
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
