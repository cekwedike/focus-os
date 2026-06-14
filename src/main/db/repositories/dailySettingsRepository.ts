import type Database from 'better-sqlite3'
import type { DailySettingsRow } from '@shared/types/db'
import type { DailyUpsertInput } from '@shared/types/schedule'
import { nowIso } from '@shared/utils/time'

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function getDailySettings(
  db: Database.Database,
  settingsDate: string
): DailySettingsRow | null {
  const row = db
    .prepare('SELECT * FROM daily_settings WHERE settings_date = ?')
    .get(settingsDate) as DailySettingsRow | undefined
  return row ?? null
}

export function getYesterdaySettings(
  db: Database.Database,
  settingsDate: string
): DailySettingsRow | null {
  const yesterday = addDays(settingsDate, -1)
  return getDailySettings(db, yesterday)
}

export function upsertDailySettings(
  db: Database.Database,
  input: DailyUpsertInput
): DailySettingsRow {
  const existing = getDailySettings(db, input.settings_date)
  const timestamp = nowIso()

  if (existing) {
    db.prepare(
      `
      UPDATE daily_settings SET
        wake_time = @wake_time,
        sleep_target_time = @sleep_target_time,
        buffer_percent = @buffer_percent,
        remaining_minutes_at_wake = @remaining_minutes_at_wake,
        notes = @notes,
        updated_at = @updated_at
      WHERE settings_date = @settings_date
    `
    ).run({
      settings_date: input.settings_date,
      wake_time: input.wake_time !== undefined ? input.wake_time : existing.wake_time,
      sleep_target_time:
        input.sleep_target_time !== undefined
          ? input.sleep_target_time
          : existing.sleep_target_time,
      buffer_percent: input.buffer_percent ?? existing.buffer_percent,
      remaining_minutes_at_wake:
        input.remaining_minutes_at_wake !== undefined
          ? input.remaining_minutes_at_wake
          : existing.remaining_minutes_at_wake,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      updated_at: timestamp,
    })
  } else {
    db.prepare(
      `
      INSERT INTO daily_settings (
        settings_date, wake_time, sleep_target_time, buffer_percent,
        remaining_minutes_at_wake, allocation_version, notes, created_at, updated_at
      ) VALUES (
        @settings_date, @wake_time, @sleep_target_time, @buffer_percent,
        @remaining_minutes_at_wake, 1, @notes, @created_at, @updated_at
      )
    `
    ).run({
      settings_date: input.settings_date,
      wake_time: input.wake_time ?? null,
      sleep_target_time: input.sleep_target_time ?? null,
      buffer_percent: input.buffer_percent ?? 10,
      remaining_minutes_at_wake: input.remaining_minutes_at_wake ?? null,
      notes: input.notes ?? null,
      created_at: timestamp,
      updated_at: timestamp,
    })
  }

  const saved = getDailySettings(db, input.settings_date)
  if (!saved) {
    throw new Error('Failed to save daily settings')
  }
  return saved
}

export function incrementAllocationVersion(
  db: Database.Database,
  settingsDate: string
): DailySettingsRow {
  const existing = getDailySettings(db, settingsDate)
  if (!existing) {
    throw new Error(`Daily settings not found for ${settingsDate}`)
  }

  db.prepare(
    `
    UPDATE daily_settings
    SET allocation_version = allocation_version + 1, updated_at = @updated_at
    WHERE settings_date = @settings_date
  `
  ).run({ settings_date: settingsDate, updated_at: nowIso() })

  const updated = getDailySettings(db, settingsDate)
  if (!updated) {
    throw new Error('Failed to increment allocation version')
  }
  return updated
}
