import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types/ipc'
import type { BreakListFilters, CreateBreakInput, UpdateBreakInput } from '@shared/types/breaks'
import { getDatabase } from '../db/connection'
import {
  createBreak,
  listBreaks,
  updateBreak,
} from '../db/repositories/breaksLogRepository'
import { resetMicroBreakAccumulator } from '../services/timerService'

function success<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function failure(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } }
}

export function registerBreakHandlers(): void {
  ipcMain.handle('breaks:list', async (_event, filters: BreakListFilters = {}) => {
    try {
      return success(listBreaks(getDatabase(), filters))
    } catch (error) {
      return failure('BREAKS_LIST_FAILED', String(error))
    }
  })

  ipcMain.handle('breaks:create', async (_event, payload: CreateBreakInput) => {
    try {
      const created = createBreak(getDatabase(), payload)
      if (payload.break_type === 'micro') {
        resetMicroBreakAccumulator()
      }
      return success(created)
    } catch (error) {
      return failure('BREAKS_CREATE_FAILED', String(error))
    }
  })

  ipcMain.handle('breaks:update', async (_event, payload: UpdateBreakInput) => {
    try {
      const updated = updateBreak(getDatabase(), payload)
      if (!updated) {
        return failure('BREAK_NOT_FOUND', `Break ${payload.id} not found`)
      }
      return success(updated)
    } catch (error) {
      return failure('BREAKS_UPDATE_FAILED', String(error))
    }
  })

  ipcMain.handle('breaks:log', async (_event, payload: CreateBreakInput) => {
    try {
      return success(createBreak(getDatabase(), payload))
    } catch (error) {
      return failure('BREAKS_LOG_FAILED', String(error))
    }
  })
}
