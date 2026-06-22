import { BrowserWindow, ipcMain } from 'electron'
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
import {
  completeAndAdvance,
  extendActiveBlock,
  skipBlock,
} from '../services/blockProgressionService'

function success<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function failure(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } }
}

function emitScheduleBlockChanged(payload: {
  scheduleDate: string
  blockId: number
  nextBlockId: number | null
  reason: 'manual_completed' | 'skipped' | 'extended'
}): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('schedule:block-changed', payload)
  }
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

  ipcMain.handle(
    'schedule:complete-and-advance',
    async (_event, payload: { blockId: number; endTime?: string }) => {
      try {
        const result = completeAndAdvance(getDatabase(), payload.blockId, {
          endTime: payload.endTime,
          reason: 'manual_completed',
        })
        emitScheduleBlockChanged({
          scheduleDate: result.completedBlock?.schedule_date ?? new Date().toISOString().slice(0, 10),
          blockId: payload.blockId,
          nextBlockId: result.nextBlock?.id ?? null,
          reason: 'manual_completed',
        })
        return success(result)
      } catch (error) {
        return failure('SCHEDULE_COMPLETE_ADVANCE_FAILED', String(error))
      }
    }
  )

  ipcMain.handle(
    'schedule:extend-block',
    async (_event, payload: { blockId: number; minutes?: number }) => {
      try {
        const updated = extendActiveBlock(
          getDatabase(),
          payload.blockId,
          payload.minutes ?? 5
        )
        emitScheduleBlockChanged({
          scheduleDate: updated.schedule_date,
          blockId: updated.id,
          nextBlockId: null,
          reason: 'extended',
        })
        return success(updated)
      } catch (error) {
        return failure('SCHEDULE_EXTEND_BLOCK_FAILED', String(error))
      }
    }
  )

  ipcMain.handle('schedule:skip-block', async (_event, payload: { blockId: number }) => {
    try {
      const result = skipBlock(getDatabase(), payload.blockId)
      emitScheduleBlockChanged({
        scheduleDate: result.completedBlock?.schedule_date ?? new Date().toISOString().slice(0, 10),
        blockId: payload.blockId,
        nextBlockId: result.nextBlock?.id ?? null,
        reason: 'skipped',
      })
      return success(result)
    } catch (error) {
      return failure('SCHEDULE_SKIP_BLOCK_FAILED', String(error))
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

  ipcMain.handle('schedule:auto-start-day', async () => {
    try {
      const { autoStartFirstBlockOfDay } = await import('../services/dayNarrator')
      autoStartFirstBlockOfDay()
      return success({ started: true })
    } catch (error) {
      return failure('SCHEDULE_AUTO_START_FAILED', String(error))
    }
  })

  ipcMain.handle(
    'schedule:snooze-block',
    async (_event, payload: { blockId: number; minutes?: number }) => {
      try {
        const { handleSnoozeBlock } = await import('../services/dayNarrator')
        handleSnoozeBlock(payload.blockId, payload.minutes ?? 5)
        return success({ snoozed: true })
      } catch (error) {
        return failure('SCHEDULE_SNOOZE_FAILED', String(error))
      }
    }
  )

  ipcMain.handle(
    'schedule:pause-auto-start',
    async (_event, payload: { minutes?: number }) => {
      try {
        const { handlePauseAutoStart } = await import('../services/dayNarrator')
        handlePauseAutoStart(payload.minutes ?? 30)
        return success({ paused: true })
      } catch (error) {
        return failure('SCHEDULE_PAUSE_AUTO_START_FAILED', String(error))
      }
    }
  )
}
