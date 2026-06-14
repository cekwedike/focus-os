import { ipcMain } from 'electron'
import type { AppPingResponse, IpcResult } from '@shared/types/ipc'
import { initializeDatabase } from '../db/connection'
import { registerClientHandlers, registerDatabaseHandlers, registerProtectedBlockHandlers } from './clientHandlers'
import { registerSettingsHandlers } from './settingsHandlers'
import { registerTaskHandlers } from './taskHandlers'
import { registerDailyHandlers } from './dailyHandlers'
import { registerScheduleHandlers } from './scheduleHandlers'
import { registerBreakHandlers } from './breakHandlers'

let databaseReady = false

export function bootstrapDatabase(): void {
  initializeDatabase()
  databaseReady = true
}

export function isDatabaseReady(): boolean {
  return databaseReady
}

export function registerIpcHandlers(): void {
  ipcMain.handle('app:ping', async (): Promise<IpcResult<AppPingResponse>> => {
    return {
      ok: true,
      data: {
        version: '0.1.0',
        ready: true,
        databaseReady,
      },
    }
  })

  registerDatabaseHandlers()
  registerClientHandlers()
  registerProtectedBlockHandlers()
  registerSettingsHandlers()
  registerTaskHandlers()
  registerDailyHandlers()
  registerScheduleHandlers()
  registerBreakHandlers()
}
