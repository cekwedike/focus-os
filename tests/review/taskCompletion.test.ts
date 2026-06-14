import { describe, expect, it } from 'vitest'
import { calculateTaskCompletionRate } from '../../src/shared/review/taskCompletion'
import type { ReviewScheduleRow } from '../../src/shared/types/review'

function row(partial: Partial<ReviewScheduleRow>): ReviewScheduleRow {
  return {
    schedule_date: '2026-06-14',
    block_type: 'weighted_client',
    protected_subtype: null,
    client_id: 1,
    client_name: 'Acme',
    planned_duration_minutes: 60,
    actual_duration_minutes: 60,
    actual_start: '2026-06-14T09:00:00',
    actual_end: '2026-06-14T10:00:00',
    status: 'completed',
    task_id: 1,
    ...partial,
  }
}

describe('calculateTaskCompletionRate', () => {
  it('returns null when no scheduled task blocks exist', () => {
    expect(calculateTaskCompletionRate([])).toEqual({
      scheduledTaskBlocks: 0,
      completedTaskBlocks: 0,
      taskCompletionRate: null,
    })
  })

  it('calculates partial completion percentage', () => {
    const result = calculateTaskCompletionRate([
      row({ task_id: 1, status: 'completed' }),
      row({ task_id: 2, status: 'planned' }),
      row({ task_id: null, status: 'completed' }),
      row({ task_id: 3, status: 'superseded' }),
    ])

    expect(result).toEqual({
      scheduledTaskBlocks: 2,
      completedTaskBlocks: 1,
      taskCompletionRate: 50,
    })
  })
})
