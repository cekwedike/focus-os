import type { LongBreakReasonSummary, ReviewBreakRow } from '@shared/types/review'

export interface BreakAnalysisResult {
  microBreaks: { count: number; totalMinutes: number }
  longBreaks: { count: number; totalMinutes: number }
  longBreakReasons: LongBreakReasonSummary[]
}

export function analyzeBreaks(rows: ReviewBreakRow[]): BreakAnalysisResult {
  const microBreaks = { count: 0, totalMinutes: 0 }
  const longBreaks = { count: 0, totalMinutes: 0 }
  const reasonMap = new Map<string, { count: number; totalMinutes: number }>()

  for (const row of rows) {
    const minutes = row.duration_minutes ?? 0

    if (row.break_type === 'micro') {
      microBreaks.count += 1
      microBreaks.totalMinutes += minutes
      continue
    }

    if (row.break_type === 'long') {
      longBreaks.count += 1
      longBreaks.totalMinutes += minutes

      const reason = row.reason?.trim() || 'No reason given'
      const existing = reasonMap.get(reason) ?? { count: 0, totalMinutes: 0 }
      existing.count += 1
      existing.totalMinutes += minutes
      reasonMap.set(reason, existing)
    }
  }

  const longBreakReasons = [...reasonMap.entries()]
    .map(([reason, value]) => ({
      reason,
      count: value.count,
      totalMinutes: value.totalMinutes,
    }))
    .sort((left, right) => right.count - left.count)

  return { microBreaks, longBreaks, longBreakReasons }
}
