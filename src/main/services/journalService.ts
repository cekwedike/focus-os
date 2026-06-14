import type Database from 'better-sqlite3'
import type { FaithLogRow } from '@shared/types/db'
import type {
  JournalCompleteFaithBlockPayload,
  JournalStatsResponse,
  JournalUpsertPayload,
} from '@shared/types/journal'
import { calculateFaithStreaks } from '@shared/utils/faithStreak'
import {
  countFaithEntriesThisMonth,
  getFaithEntryByDate,
  listAllFaithEntries,
  listFaithEntriesInRange,
  totalFaithWordCount,
  upsertFaithEntry,
} from '../db/repositories/faithLogRepository'
import { getBlockById } from '../db/repositories/dailyScheduleRepository'
import { completeBlock } from './scheduleService'

export function getJournalEntry(
  db: Database.Database,
  date: string
): FaithLogRow | null {
  return getFaithEntryByDate(db, date)
}

export function upsertJournalEntry(
  db: Database.Database,
  payload: JournalUpsertPayload
): FaithLogRow {
  return upsertFaithEntry(
    db,
    payload.entry_date,
    payload.bible_reference,
    payload.prayer_notes ?? null
  )
}

export function listJournalEntries(db: Database.Database): FaithLogRow[] {
  return listAllFaithEntries(db)
}

export function listJournalEntriesInRange(
  db: Database.Database,
  startDate: string,
  endDate: string
): FaithLogRow[] {
  return listFaithEntriesInRange(db, startDate, endDate)
}

export function getJournalStats(
  db: Database.Database,
  today: string
): JournalStatsResponse {
  const entries = listAllFaithEntries(db)
  const streaks = calculateFaithStreaks(entries, today)

  return {
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
    entriesThisMonth: countFaithEntriesThisMonth(db, today),
    totalWordCount: totalFaithWordCount(db),
  }
}

export function completeFaithBlock(
  db: Database.Database,
  payload: JournalCompleteFaithBlockPayload
) {
  const block = getBlockById(db, payload.blockId)
  if (!block) {
    throw new Error('BLOCK_NOT_FOUND')
  }

  if (block.block_type !== 'protected' || block.protected_subtype !== 'faith') {
    throw new Error('BLOCK_NOT_FAITH')
  }

  const run = db.transaction(() => {
    const entry = upsertFaithEntry(
      db,
      block.schedule_date,
      payload.bible_reference,
      payload.prayer_notes ?? null
    )
    const completed = completeBlock(db, payload.blockId)
    return { entry, block: completed }
  })

  return run()
}
