import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types/ipc'
import type { ReviewDateRangePayload } from '@shared/types/review'
import { getDatabase } from '../db/connection'
import { getReviewSummary } from '../services/reviewService'

function success<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function failure(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } }
}

export function registerReviewHandlers(): void {
  ipcMain.handle('review:get-summary', async (_event, payload: ReviewDateRangePayload) => {
    try {
      return success(getReviewSummary(getDatabase(), payload))
    } catch (error) {
      return failure('REVIEW_GET_SUMMARY_FAILED', String(error))
    }
  })
}
