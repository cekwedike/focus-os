import { describe, expect, it } from 'vitest'
import {
  aggregateClientGroups,
  aggregateProtectedDaySummaries,
  aggregateProtectedGroups,
} from '../../src/shared/review/plannedVsActual'
import type { ReviewScheduleRow } from '../../src/shared/types/review'

function row(partial: Partial<ReviewScheduleRow> & Pick<ReviewScheduleRow, 'schedule_date'>): ReviewScheduleRow {
  return {
    block_type: 'weighted_client',
    protected_subtype: null,
    client_id: 1,
    client_name: 'Acme',
    planned_duration_minutes: 60,
    actual_duration_minutes: 45,
    actual_start: '2026-06-14T09:00:00',
    actual_end: '2026-06-14T09:45:00',
    status: 'completed',
    task_id: null,
    ...partial,
  }
}

describe('plannedVsActual aggregations', () => {
  it('aggregates planned and actual minutes by client', () => {
    const groups = aggregateClientGroups([
      row({ schedule_date: '2026-06-14', client_id: 1, client_name: 'Acme', planned_duration_minutes: 60, actual_duration_minutes: 45 }),
      row({ schedule_date: '2026-06-15', client_id: 1, client_name: 'Acme', planned_duration_minutes: 30, actual_duration_minutes: 30 }),
      row({ schedule_date: '2026-06-14', client_id: 2, client_name: 'Beta', planned_duration_minutes: 45, actual_duration_minutes: 20 }),
    ])

    const acme = groups.find((group) => group.id === '1')
    expect(acme?.plannedMinutes).toBe(90)
    expect(acme?.actualMinutes).toBe(75)
    expect(acme?.completedCount).toBe(2)
  })

  it('treats never-started blocks as zero actual minutes', () => {
    const groups = aggregateClientGroups([
      row({
        schedule_date: '2026-06-14',
        actual_start: null,
        actual_end: null,
        actual_duration_minutes: null,
        status: 'planned',
      }),
    ])

    expect(groups[0]?.actualMinutes).toBe(0)
    expect(groups[0]?.notStartedCount).toBe(1)
    expect(groups[0]?.completedCount).toBe(0)
  })

  it('ignores superseded blocks', () => {
    const groups = aggregateClientGroups([
      row({ schedule_date: '2026-06-14', status: 'superseded', planned_duration_minutes: 120 }),
      row({ schedule_date: '2026-06-14', planned_duration_minutes: 30 }),
    ])

    expect(groups[0]?.plannedMinutes).toBe(30)
  })

  it('returns empty groups when no rows exist in range', () => {
    expect(aggregateClientGroups([])).toEqual([])
    expect(aggregateProtectedGroups([])).toEqual([])
    expect(aggregateProtectedDaySummaries([])).toEqual([])
  })

  it('summarizes protected block completion by day', () => {
    const summaries = aggregateProtectedDaySummaries([
      row({
        schedule_date: '2026-06-14',
        block_type: 'protected',
        protected_subtype: 'faith',
        client_id: null,
        client_name: null,
        status: 'completed',
      }),
      row({
        schedule_date: '2026-06-15',
        block_type: 'protected',
        protected_subtype: 'faith',
        client_id: null,
        client_name: null,
        status: 'planned',
        actual_start: null,
        actual_end: null,
        actual_duration_minutes: null,
      }),
    ])

    expect(summaries).toEqual([
      {
        protectedSubtype: 'faith',
        label: 'Faith',
        daysWithBlock: 2,
        daysCompleted: 1,
      },
    ])
  })
})
