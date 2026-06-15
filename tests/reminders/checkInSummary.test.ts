import { describe, expect, it } from 'vitest'
import { aggregateCheckInSummaries } from '../../src/shared/review/checkInSummary'
import type { CheckInLogRow } from '../../src/shared/types/db'

function row(partial: Partial<CheckInLogRow> & Pick<CheckInLogRow, 'id' | 'client_project_id'>): CheckInLogRow {
  return {
    check_in_date: '2026-06-14',
    scheduled_at: '2026-06-14T13:00:00.000Z',
    acknowledged_at: '2026-06-14T13:05:00.000Z',
    actual_interval_minutes: null,
    created_at: '2026-06-14T13:05:00.000Z',
    ...partial,
  }
}

describe('aggregateCheckInSummaries', () => {
  const clients = [
    { id: 1, name: 'PLNITUDE', reminder_interval_minutes: 30 },
    { id: 2, name: 'Acme', reminder_interval_minutes: 60 },
  ]

  it('returns empty summaries when no check-ins exist', () => {
    expect(aggregateCheckInSummaries([], clients)).toEqual([])
  })

  it('aggregates average interval, count, and overdue totals', () => {
    const summaries = aggregateCheckInSummaries(
      [
        row({ id: 1, client_project_id: 1, actual_interval_minutes: null }),
        row({
          id: 2,
          client_project_id: 1,
          acknowledged_at: '2026-06-14T14:10:00.000Z',
          actual_interval_minutes: 65,
        }),
      ],
      clients
    )

    expect(summaries).toHaveLength(1)
    expect(summaries[0].checkInCount).toBe(2)
    expect(summaries[0].averageActualIntervalMinutes).toBe(65)
    expect(summaries[0].overdueCount).toBe(1)
  })
})
