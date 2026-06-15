import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types/ipc'
import type {
  NotificationActionPayload,
  NotificationActionResponse,
  NotificationListActiveResponse,
} from '@shared/types/notifications'
import {
  getActiveNotifications,
  performNotificationAction,
} from '../services/notificationService'

function success<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function failure(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } }
}

export function registerNotificationHandlers(): void {
  ipcMain.handle('notification:list-active', async () => {
    try {
      const response: NotificationListActiveResponse = {
        active: getActiveNotifications(),
      }
      return success(response)
    } catch (error) {
      return failure('NOTIFICATION_LIST_ACTIVE_FAILED', String(error))
    }
  })

  ipcMain.handle(
    'notification:action',
    async (_event, payload: NotificationActionPayload) => {
      try {
        if (!payload?.notificationId || !payload?.actionId) {
          return failure('VALIDATION_ERROR', 'notificationId and actionId are required')
        }

        const result: NotificationActionResponse = performNotificationAction(
          payload.notificationId,
          payload.actionId
        )
        return success(result)
      } catch (error) {
        return failure('NOTIFICATION_ACTION_FAILED', String(error))
      }
    }
  )
}
