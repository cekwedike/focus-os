import type { FaithLogRow } from './db'

export interface JournalGetEntryPayload {
  date: string
}

export interface JournalUpsertPayload {
  entry_date: string
  bible_reference: string
  prayer_notes?: string | null
}

export interface JournalListRangePayload {
  startDate: string
  endDate: string
}

export interface JournalStatsPayload {
  today: string
}

export interface JournalCompleteFaithBlockPayload {
  blockId: number
  bible_reference: string
  prayer_notes?: string | null
}

export interface JournalStatsResponse {
  currentStreak: number
  longestStreak: number
  entriesThisMonth: number
  totalWordCount: number
}

export interface JournalCompleteFaithBlockResponse {
  entry: FaithLogRow
  block: import('./db').DailyScheduleRow
}

export type JournalGetEntryResponse = FaithLogRow | null
export type JournalListResponse = FaithLogRow[]
