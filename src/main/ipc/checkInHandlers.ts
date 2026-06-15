import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types/ipc'
import {
  acknowledgeCheckIn,
  getDueCheckIns,
} from '../services/checkInService'

function success<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function failure(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } }
}

export function registerCheckInHandlers(): void {
  ipcMain.handle('check-ins:get-due', async () => {
    try {
      return success({ due: getDueCheckIns() })
    } catch (error) {
      return failure('CHECK_INS_GET_DUE_FAILED', String(error))
    }
  })

  ipcMain.handle('check-ins:acknowledge', async (_event, payload: { clientId: number }) => {
    try {
      if (!payload?.clientId) {
        return failure('VALIDATION_ERROR', 'clientId is required')
      }

      const wasDue = getDueCheckIns().some((entry) => entry.clientId === payload.clientId)
      if (!wasDue) {
        return failure('CHECK_IN_NOT_DUE', 'No due check-in for this client')
      }

      acknowledgeCheckIn(payload.clientId)
      return success({ due: getDueCheckIns() })
    } catch (error) {
      return failure('CHECK_INS_ACKNOWLEDGE_FAILED', String(error))
    }
  })
}
