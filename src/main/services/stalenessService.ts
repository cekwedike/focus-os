import type { BrowserWindow } from 'electron'
import { listStaleClients } from '@shared/insights/stalenessSnapshot'
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
  const staleClients = listStaleClients(listClients(getDatabase()), {
    defaultStalenessHours: settings.defaultStalenessHours,
  })

  for (const client of staleClients) {
    if (!alertedClients.has(client.clientId)) {
      mainWindow.webContents.send('staleness:alert', {
        clientId: client.clientId,
        clientName: client.clientName,
        hoursSinceTouch: client.hoursSinceTouch,
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
