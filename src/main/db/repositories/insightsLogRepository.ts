import type Database from 'better-sqlite3'
import type { InsightLogRow, InsightSource } from '@shared/types/insights'
import { nowIso } from '@shared/utils/time'

export interface InsertInsightInput {
  insightDate: string
  source: InsightSource
  model: string | null
  promptSnapshotJson: string | null
  contentMarkdown: string
  generationMs: number | null
  errorMessage: string | null
}

export function insertInsight(db: Database.Database, input: InsertInsightInput): InsightLogRow {
  const timestamp = nowIso()

  const result = db
    .prepare(
      `
      INSERT INTO insights_log (
        insight_date,
        source,
        model,
        prompt_snapshot_json,
        content_markdown,
        generation_ms,
        error_message,
        created_at
      ) VALUES (
        @insight_date,
        @source,
        @model,
        @prompt_snapshot_json,
        @content_markdown,
        @generation_ms,
        @error_message,
        @created_at
      )
    `
    )
    .run({
      insight_date: input.insightDate,
      source: input.source,
      model: input.model,
      prompt_snapshot_json: input.promptSnapshotJson,
      content_markdown: input.contentMarkdown,
      generation_ms: input.generationMs,
      error_message: input.errorMessage,
      created_at: timestamp,
    })

  const row = db
    .prepare('SELECT * FROM insights_log WHERE id = ?')
    .get(result.lastInsertRowid) as InsightLogRow | undefined

  if (!row) {
    throw new Error('Failed to insert insight')
  }

  return row
}

export function getLatestInsightForDate(
  db: Database.Database,
  insightDate: string
): InsightLogRow | null {
  const row = db
    .prepare(
      `
      SELECT *
      FROM insights_log
      WHERE insight_date = ?
      ORDER BY created_at DESC
      LIMIT 1
    `
    )
    .get(insightDate) as InsightLogRow | undefined

  return row ?? null
}

export function listInsightHistory(
  db: Database.Database,
  limit: number = 30
): InsightLogRow[] {
  return db
    .prepare(
      `
      SELECT *
      FROM insights_log
      ORDER BY insight_date DESC, created_at DESC
      LIMIT ?
    `
    )
    .all(limit) as InsightLogRow[]
}
