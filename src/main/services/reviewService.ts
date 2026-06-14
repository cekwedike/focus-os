import type Database from 'better-sqlite3'
import type { ReviewDateRangePayload, ReviewSummary } from '@shared/types/review'
import { getReviewSummary as buildReviewSummary } from '../db/repositories/reviewRepository'

export function getReviewSummary(
  db: Database.Database,
  payload: ReviewDateRangePayload
): ReviewSummary {
  return buildReviewSummary(db, payload)
}
