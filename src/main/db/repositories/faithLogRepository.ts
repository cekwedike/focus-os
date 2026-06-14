import type Database from 'better-sqlite3'
import type { FaithLogRow } from '@shared/types/db'
import { countWords } from '@shared/utils/wordCount'
import { nowIso } from '@shared/utils/time'

export function getFaithEntryByDate(
  db: Database.Database,
  entryDate: string
): FaithLogRow | null {
  const row = db
    .prepare('SELECT * FROM faith_log WHERE entry_date = ?')
    .get(entryDate) as FaithLogRow | undefined
  return row ?? null
}

export function listAllFaithEntries(db: Database.Database): FaithLogRow[] {
  return db
    .prepare('SELECT * FROM faith_log ORDER BY entry_date DESC')
    .all() as FaithLogRow[]
}

export function listFaithEntriesInRange(
  db: Database.Database,
  startDate: string,
  endDate: string
): FaithLogRow[] {
  return db
    .prepare(
      `
      SELECT *
      FROM faith_log
      WHERE entry_date >= @startDate AND entry_date <= @endDate
      ORDER BY entry_date DESC
    `
    )
    .all({ startDate, endDate }) as FaithLogRow[]
}

export function countFaithEntriesThisMonth(
  db: Database.Database,
  todayDate: string
): number {
  const monthPrefix = todayDate.slice(0, 7)
  const row = db
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM faith_log
      WHERE entry_date LIKE @monthPrefix || '%'
        AND bible_reference IS NOT NULL
        AND TRIM(bible_reference) != ''
    `
    )
    .get({ monthPrefix }) as { count: number }
  return row.count
}

export function totalFaithWordCount(db: Database.Database): number {
  const row = db
    .prepare('SELECT COALESCE(SUM(word_count), 0) AS total FROM faith_log')
    .get() as { total: number }
  return row.total
}

export function upsertFaithEntry(
  db: Database.Database,
  entryDate: string,
  bibleReference: string,
  prayerNotes: string | null
): FaithLogRow {
  const trimmedReference = bibleReference.trim()
  if (!trimmedReference) {
    throw new Error('Bible reference is required')
  }

  const existing = getFaithEntryByDate(db, entryDate)
  const timestamp = nowIso()
  const wordCount = countWords(prayerNotes)

  if (existing) {
    db.prepare(
      `
      UPDATE faith_log SET
        bible_reference = @bible_reference,
        prayer_notes = @prayer_notes,
        word_count = @word_count,
        updated_at = @updated_at
      WHERE entry_date = @entry_date
    `
    ).run({
      entry_date: entryDate,
      bible_reference: trimmedReference,
      prayer_notes: prayerNotes,
      word_count: wordCount,
      updated_at: timestamp,
    })
  } else {
    db.prepare(
      `
      INSERT INTO faith_log (
        entry_date, bible_reference, prayer_notes, word_count, created_at, updated_at
      ) VALUES (
        @entry_date, @bible_reference, @prayer_notes, @word_count, @created_at, @updated_at
      )
    `
    ).run({
      entry_date: entryDate,
      bible_reference: trimmedReference,
      prayer_notes: prayerNotes,
      word_count: wordCount,
      created_at: timestamp,
      updated_at: timestamp,
    })
  }

  const saved = getFaithEntryByDate(db, entryDate)
  if (!saved) {
    throw new Error('Failed to save faith entry')
  }
  return saved
}
