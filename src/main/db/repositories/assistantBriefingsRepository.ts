import type Database from 'better-sqlite3'
import type { AssistantBriefingRow, BriefingType } from '@shared/types/integrations'
import { nowIso } from '@shared/utils/time'

export function insertBriefing(
  db: Database.Database,
  input: {
    briefingType: BriefingType
    scheduleDate?: string | null
    contentMd: string
    snapshotJson?: string | null
    provider?: string
  }
): AssistantBriefingRow {
  const generatedAt = nowIso()
  const result = db
    .prepare(
      `
      INSERT INTO assistant_briefings (
        briefing_type, schedule_date, generated_at, content_md, snapshot_json, provider
      ) VALUES (
        @briefing_type, @schedule_date, @generated_at, @content_md, @snapshot_json, @provider
      )
    `
    )
    .run({
      briefing_type: input.briefingType,
      schedule_date: input.scheduleDate ?? null,
      generated_at: generatedAt,
      content_md: input.contentMd,
      snapshot_json: input.snapshotJson ?? null,
      provider: input.provider ?? 'none',
    })

  return db
    .prepare('SELECT * FROM assistant_briefings WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as AssistantBriefingRow
}

export function listBriefingsForDate(
  db: Database.Database,
  scheduleDate: string,
  limit = 20
): AssistantBriefingRow[] {
  return db
    .prepare(
      `
      SELECT * FROM assistant_briefings
      WHERE schedule_date = ? OR schedule_date IS NULL
      ORDER BY generated_at DESC
      LIMIT ?
    `
    )
    .all(scheduleDate, limit) as AssistantBriefingRow[]
}

export function getLatestBriefing(
  db: Database.Database,
  briefingType: BriefingType,
  scheduleDate?: string
): AssistantBriefingRow | undefined {
  if (scheduleDate) {
    return db
      .prepare(
        `
        SELECT * FROM assistant_briefings
        WHERE briefing_type = ? AND schedule_date = ?
        ORDER BY generated_at DESC
        LIMIT 1
      `
      )
      .get(briefingType, scheduleDate) as AssistantBriefingRow | undefined
  }

  return db
    .prepare(
      `
      SELECT * FROM assistant_briefings
      WHERE briefing_type = ?
      ORDER BY generated_at DESC
      LIMIT 1
    `
    )
    .get(briefingType) as AssistantBriefingRow | undefined
}
