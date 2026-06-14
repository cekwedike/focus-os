import type Database from 'better-sqlite3'
import type { InsightLogRow } from '@shared/types/insights'
import { buildDailySnapshot } from '../insights/buildDailySnapshot'
import { getAllSettings } from '../db/repositories/appSettingsRepository'
import {
  getLatestInsightForDate,
  insertInsight,
  listInsightHistory,
} from '../db/repositories/insightsLogRepository'
import { generateInsightContent } from './aiService'

export function getTodayInsight(
  db: Database.Database,
  insightDate: string
): InsightLogRow | null {
  return getLatestInsightForDate(db, insightDate)
}

export function listInsights(db: Database.Database, limit?: number): InsightLogRow[] {
  return listInsightHistory(db, limit)
}

export async function generateInsight(
  db: Database.Database,
  insightDate: string
): Promise<InsightLogRow> {
  const snapshot = buildDailySnapshot(db, insightDate)
  const settings = getAllSettings(db)
  const result = await generateInsightContent(snapshot, settings)

  return insertInsight(db, {
    insightDate,
    source: result.source,
    model: result.model,
    promptSnapshotJson: JSON.stringify(snapshot),
    contentMarkdown: result.contentMarkdown,
    generationMs: result.generationMs,
    errorMessage: result.errorMessage,
  })
}
