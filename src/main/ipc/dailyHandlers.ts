import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types/ipc'
import type { DailyUpsertInput } from '@shared/types/schedule'
import { getDatabase } from '../db/connection'
import {
  getDailySettings,
  getYesterdaySettings,
  upsertDailySettings,
} from '../db/repositories/dailySettingsRepository'

function success<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function failure(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } }
}

export function registerDailyHandlers(): void {
  ipcMain.handle('daily:get', async (_event, payload: { date: string }) => {
    try {
      const settings = getDailySettings(getDatabase(), payload.date)
      const yesterday = getYesterdaySettings(getDatabase(), payload.date)
      return success({ settings, yesterday })
    } catch (error) {
      return failure('DAILY_GET_FAILED', String(error))
    }
  })

  ipcMain.handle('daily:upsert', async (_event, payload: DailyUpsertInput) => {
    try {
      return success(upsertDailySettings(getDatabase(), payload))
    } catch (error) {
      return failure('DAILY_UPSERT_FAILED', String(error))
    }
  })
}
