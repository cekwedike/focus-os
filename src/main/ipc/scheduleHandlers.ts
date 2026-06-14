import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types/ipc'
import type {
  ScheduleCommitPayload,
  ScheduleGeneratePayload,
  ScheduleGetDayPayload,
  ScheduleReallocatePayload,
  ScheduleUpdateBlockPayload,
} from '@shared/types/schedule'
import { getDatabase } from '../db/connection'
import {
  applyReallocationAfterLongBreak,
  commitDaySchedule,
  completeBlock,
  getDayBundle,
  previewDaySchedule,
  startBlock,
  updateBlockTimes,
} from '../services/scheduleService'

function success<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function failure(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } }
}

export function registerScheduleHandlers(): void {
  ipcMain.handle('schedule:generate', async (_event, payload: ScheduleGeneratePayload) => {
    try {
      return success(previewDaySchedule(getDatabase(), payload))
    } catch (error) {
      return failure('SCHEDULE_GENERATE_FAILED', String(error))
    }
  })

  ipcMain.handle('schedule:commit', async (_event, payload: ScheduleCommitPayload) => {
    try {
      return success(commitDaySchedule(getDatabase(), payload))
    } catch (error) {
      if (String(error).includes('SCHEDULE_EXISTS')) {
        return failure('SCHEDULE_EXISTS', 'Schedule already exists for this date. Confirm overwrite.')
      }
      return failure('SCHEDULE_COMMIT_FAILED', String(error))
    }
  })

  ipcMain.handle('schedule:get-day', async (_event, payload: ScheduleGetDayPayload) => {
    try {
      return success(getDayBundle(getDatabase(), payload.date))
    } catch (error) {
      return failure('SCHEDULE_GET_DAY_FAILED', String(error))
    }
  })

  ipcMain.handle('schedule:start-block', async (_event, payload: { blockId: number }) => {
    try {
      return success(startBlock(getDatabase(), payload.blockId))
    } catch (error) {
      return failure('SCHEDULE_START_BLOCK_FAILED', String(error))
    }
  })

  ipcMain.handle('schedule:complete-block', async (_event, payload: { blockId: number }) => {
    try {
      return success(completeBlock(getDatabase(), payload.blockId))
    } catch (error) {
      return failure('SCHEDULE_COMPLETE_BLOCK_FAILED', String(error))
    }
  })

  ipcMain.handle('schedule:update-block', async (_event, payload: ScheduleUpdateBlockPayload) => {
    try {
      if (!payload.planned_start || !payload.planned_end) {
        return failure('VALIDATION_ERROR', 'Planned start and end are required')
      }
      return success(
        updateBlockTimes(getDatabase(), payload.blockId, payload.planned_start, payload.planned_end)
      )
    } catch (error) {
      return failure('SCHEDULE_UPDATE_BLOCK_FAILED', String(error))
    }
  })

  ipcMain.handle('schedule:reallocate', async (_event, payload: ScheduleReallocatePayload) => {
    try {
      return success(applyReallocationAfterLongBreak(getDatabase(), payload))
    } catch (error) {
      return failure('SCHEDULE_REALLOCATE_FAILED', String(error))
    }
  })
}
