import { describe, expect, it } from 'vitest'
import { calculateFocusScore } from '../../src/shared/utils/focusScore'
import type { DailyScheduleRow } from '../../src/shared/types/db'

function block(partial: Partial<DailyScheduleRow> & Pick<DailyScheduleRow, 'status' | 'block_type'>): DailyScheduleRow {
  return {
    id: 1,
    schedule_date: '2026-06-14',
    protected_subtype: null,
    client_id: 1,
    task_id: null,
    title: 'Work',
    planned_start: '2026-06-14T09:00:00',
    planned_end: '2026-06-14T10:00:00',
    planned_duration_minutes: 60,
    actual_start: null,
    actual_end: null,
    actual_duration_minutes: null,
    priority_order: 0,
    metadata_json: null,
    created_at: '2026-06-14T00:00:00.000Z',
    updated_at: '2026-06-14T00:00:00.000Z',
    ...partial,
  }
}

describe('calculateFocusScore', () => {
  it('returns null when no work blocks exist', () => {
    expect(calculateFocusScore([block({ block_type: 'protected', status: 'planned' })])).toBeNull()
  })

  it('calculates completed work block percentage', () => {
    const score = calculateFocusScore([
      block({ id: 1, block_type: 'weighted_client', status: 'completed' }),
      block({ id: 2, block_type: 'fixed_client', status: 'planned' }),
      block({ id: 3, block_type: 'weighted_client', status: 'superseded' }),
    ])
    expect(score).toBe(50)
  })
})
