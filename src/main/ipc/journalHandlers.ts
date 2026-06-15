import { ipcMain } from 'electron'
import type { IpcResult } from '@shared/types/ipc'
import type {
  JournalCompleteFaithBlockPayload,
  JournalGetEntryPayload,
  JournalListRangePayload,
  JournalStatsPayload,
  JournalUpsertPayload,
} from '@shared/types/journal'
import { getDatabase } from '../db/connection'
import {
  completeFaithBlock,
  getJournalEntry,
  getJournalStats,
  listJournalEntries,
  listJournalEntriesInRange,
  upsertJournalEntry,
} from '../services/journalService'
import { acknowledgeNotificationByDedupeKey } from '../services/notificationService'

function clearFaithReminderForDate(entryDate: string): void {
  acknowledgeNotificationByDedupeKey(`faith_reminder:${entryDate}`)
}

function success<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function failure(code: string, message: string): IpcResult<never> {
  return { ok: false, error: { code, message } }
}

export function registerJournalHandlers(): void {
  ipcMain.handle('journal:get-entry', async (_event, payload: JournalGetEntryPayload) => {
    try {
      return success(getJournalEntry(getDatabase(), payload.date))
    } catch (error) {
      return failure('JOURNAL_GET_ENTRY_FAILED', String(error))
    }
  })

  ipcMain.handle('journal:upsert', async (_event, payload: JournalUpsertPayload) => {
    try {
      const saved = upsertJournalEntry(getDatabase(), payload)
      clearFaithReminderForDate(payload.entry_date)
      return success(saved)
    } catch (error) {
      return failure('JOURNAL_UPSERT_FAILED', String(error))
    }
  })

  ipcMain.handle('journal:list', async () => {
    try {
      return success(listJournalEntries(getDatabase()))
    } catch (error) {
      return failure('JOURNAL_LIST_FAILED', String(error))
    }
  })

  ipcMain.handle('journal:list-range', async (_event, payload: JournalListRangePayload) => {
    try {
      return success(listJournalEntriesInRange(getDatabase(), payload.startDate, payload.endDate))
    } catch (error) {
      return failure('JOURNAL_LIST_RANGE_FAILED', String(error))
    }
  })

  ipcMain.handle('journal:stats', async (_event, payload: JournalStatsPayload) => {
    try {
      return success(getJournalStats(getDatabase(), payload.today))
    } catch (error) {
      return failure('JOURNAL_STATS_FAILED', String(error))
    }
  })

  ipcMain.handle(
    'journal:complete-faith-block',
    async (_event, payload: JournalCompleteFaithBlockPayload) => {
      try {
        const result = completeFaithBlock(getDatabase(), payload)
        clearFaithReminderForDate(new Date().toISOString().slice(0, 10))
        return success(result)
      } catch (error) {
        const message = String(error)
        if (message.includes('BLOCK_NOT_FOUND')) {
          return failure('BLOCK_NOT_FOUND', 'Schedule block not found')
        }
        if (message.includes('BLOCK_NOT_FAITH')) {
          return failure('BLOCK_NOT_FAITH', 'Block is not a faith protected block')
        }
        return failure('JOURNAL_COMPLETE_FAITH_BLOCK_FAILED', message)
      }
    }
  )
}
