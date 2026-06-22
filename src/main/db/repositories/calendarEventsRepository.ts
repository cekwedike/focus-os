import type Database from 'better-sqlite3'
import type { CalendarEventRow } from '@shared/types/integrations'
import { nowIso } from '@shared/utils/time'

export function listCalendarEventsForRange(
  db: Database.Database,
  startAt: string,
  endAt: string,
  accountId?: number
): CalendarEventRow[] {
  if (accountId) {
    return db
      .prepare(
        `
        SELECT * FROM calendar_events
        WHERE account_id = ?
          AND is_all_day = 0
          AND start_at < ?
          AND end_at > ?
        ORDER BY start_at ASC
      `
      )
      .all(accountId, endAt, startAt) as CalendarEventRow[]
  }

  return db
    .prepare(
      `
      SELECT * FROM calendar_events
      WHERE is_all_day = 0
        AND start_at < ?
        AND end_at > ?
      ORDER BY start_at ASC
    `
    )
    .all(endAt, startAt) as CalendarEventRow[]
}

export function listCalendarEventsForDate(
  db: Database.Database,
  scheduleDate: string,
  accountId?: number
): CalendarEventRow[] {
  const dayStart = `${scheduleDate}T00:00:00`
  const dayEnd = `${scheduleDate}T23:59:59`
  return listCalendarEventsForRange(db, dayStart, dayEnd, accountId)
}

export function upsertCalendarEvent(
  db: Database.Database,
  input: Omit<CalendarEventRow, 'id' | 'synced_at'> & { synced_at?: string }
): CalendarEventRow {
  const syncedAt = input.synced_at ?? nowIso()
  const existing = db
    .prepare('SELECT id FROM calendar_events WHERE account_id = ? AND external_id = ?')
    .get(input.account_id, input.external_id) as { id: number } | undefined

  if (existing) {
    db.prepare(
      `
      UPDATE calendar_events
      SET calendar_id = @calendar_id,
          title = @title,
          start_at = @start_at,
          end_at = @end_at,
          is_all_day = @is_all_day,
          attendees_json = @attendees_json,
          location = @location,
          synced_at = @synced_at
      WHERE id = @id
    `
    ).run({
      id: existing.id,
      calendar_id: input.calendar_id,
      title: input.title,
      start_at: input.start_at,
      end_at: input.end_at,
      is_all_day: input.is_all_day,
      attendees_json: input.attendees_json,
      location: input.location,
      synced_at: syncedAt,
    })
    return db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(existing.id) as CalendarEventRow
  }

  const result = db
    .prepare(
      `
      INSERT INTO calendar_events (
        external_id, account_id, calendar_id, title, start_at, end_at,
        is_all_day, attendees_json, location, synced_at
      ) VALUES (
        @external_id, @account_id, @calendar_id, @title, @start_at, @end_at,
        @is_all_day, @attendees_json, @location, @synced_at
      )
    `
    )
    .run({ ...input, synced_at: syncedAt })

  return db
    .prepare('SELECT * FROM calendar_events WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as CalendarEventRow
}

export function deleteStaleCalendarEvents(
  db: Database.Database,
  accountId: number,
  syncedBefore: string
): number {
  const result = db
    .prepare('DELETE FROM calendar_events WHERE account_id = ? AND synced_at < ?')
    .run(accountId, syncedBefore)
  return result.changes
}

export function getNextCalendarEvent(
  db: Database.Database,
  afterIso: string
): CalendarEventRow | undefined {
  return db
    .prepare(
      `
      SELECT * FROM calendar_events
      WHERE is_all_day = 0 AND start_at >= ?
      ORDER BY start_at ASC
      LIMIT 1
    `
    )
    .get(afterIso) as CalendarEventRow | undefined
}
