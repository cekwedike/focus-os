import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types/ipc'
import { getWorkPausedState, setWorkPaused } from '../services/workPauseService'

function success<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function failure(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } }
}

export function registerWorkHandlers(): void {
  ipcMain.handle('work:set-paused', async (_event, payload: { paused: boolean }) => {
    try {
      setWorkPaused(Boolean(payload?.paused))
      return success({ paused: Boolean(payload?.paused) })
    } catch (error) {
      return failure('WORK_PAUSE_FAILED', String(error))
    }
  })

  ipcMain.handle('work:get-paused', async () => {
    try {
      return success({ paused: getWorkPausedState() })
    } catch (error) {
      return failure('WORK_GET_PAUSED_FAILED', String(error))
    }
  })
}
