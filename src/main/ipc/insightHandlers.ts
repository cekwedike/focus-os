import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types/ipc'
import type {
  InsightsGeneratePayload,
  InsightsGetTodayPayload,
  InsightsListPayload,
} from '@shared/types/insights'
import { getDatabase } from '../db/connection'
import {
  generateInsight,
  getTodayInsight,
  listInsights,
} from '../services/insightService'

function success<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function failure(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } }
}

function resolveDate(payload?: { date?: string }): string {
  return payload?.date ?? new Date().toISOString().slice(0, 10)
}

export function registerInsightHandlers(): void {
  ipcMain.handle('insights:generate', async (_event, payload: InsightsGeneratePayload = {}) => {
    try {
      return success(await generateInsight(getDatabase(), resolveDate(payload)))
    } catch (error) {
      return failure('INSIGHTS_GENERATE_FAILED', String(error))
    }
  })

  ipcMain.handle('insights:get-today', async (_event, payload: InsightsGetTodayPayload = {}) => {
    try {
      return success(getTodayInsight(getDatabase(), resolveDate(payload)))
    } catch (error) {
      return failure('INSIGHTS_GET_TODAY_FAILED', String(error))
    }
  })

  ipcMain.handle('insights:list', async (_event, payload: InsightsListPayload = {}) => {
    try {
      return success(listInsights(getDatabase(), payload.limit))
    } catch (error) {
      return failure('INSIGHTS_LIST_FAILED', String(error))
    }
  })
}
