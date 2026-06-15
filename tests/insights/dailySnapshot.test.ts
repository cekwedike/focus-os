import { describe, expect, it } from 'vitest'
import {
  buildBumpedTasksFromRows,
  composeDailySnapshot,
} from '../../src/shared/insights/composeDailySnapshot'
import type { ClientProjectRow, DailyScheduleRow, TaskRow } from '../../src/shared/types/db'

function client(partial: Partial<ClientProjectRow> & Pick<ClientProjectRow, 'id' | 'name'>): ClientProjectRow {
  return {
    color: '#2DD4A0',
    weight_percent: 25,
    is_active: 1,
    fixed_block_enabled: 0,
    fixed_block_start: null,
    fixed_block_duration_minutes: null,
    last_touched_at: '2026-06-13T10:00:00.000Z',
    staleness_threshold_hours: null,
    reminder_enabled: 0,
    reminder_interval_minutes: null,
    reminder_label: null,
    sort_order: 0,
    created_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-06-01T00:00:00.000Z',
    ...partial,
  }
}

function block(partial: Partial<DailyScheduleRow> & Pick<DailyScheduleRow, 'id' | 'title'>): DailyScheduleRow {
  return {
    schedule_date: '2026-06-14',
    block_type: 'weighted_client',
    protected_subtype: null,
    client_id: 1,
    task_id: 1,
    planned_start: '2026-06-14T09:00:00',
    planned_end: '2026-06-14T10:00:00',
    planned_duration_minutes: 60,
    actual_start: null,
    actual_end: null,
    actual_duration_minutes: null,
    status: 'planned',
    priority_order: 0,
    metadata_json: null,
    created_at: '2026-06-14T00:00:00.000Z',
    updated_at: '2026-06-14T00:00:00.000Z',
    ...partial,
  }
}

function task(partial: Partial<TaskRow> & Pick<TaskRow, 'id' | 'title'>): TaskRow {
  return {
    client_id: 1,
    description: null,
    priority: 2,
    deadline_date: null,
    estimated_minutes: 60,
    status: 'pending',
    deferred_to_date: null,
    completed_at: null,
    created_at: '2026-06-14T00:00:00.000Z',
    updated_at: '2026-06-14T00:00:00.000Z',
    ...partial,
  }
}

describe('composeDailySnapshot', () => {
  it('builds a full snapshot with schedule, tasks, faith, and yesterday summary', () => {
    const snapshot = composeDailySnapshot({
      scheduleDate: '2026-06-14',
      generatedAt: '2026-06-14T08:00:00.000Z',
      blocks: [block({ id: 1, title: 'Acme work' })],
      tasks: [
        task({ id: 1, title: 'Pending task', status: 'pending' }),
        task({ id: 2, title: 'Done task', status: 'completed' }),
      ],
      clients: [client({ id: 1, name: 'Acme' })],
      stalenessSettings: { defaultStalenessHours: 48 },
      faith: {
        currentStreak: 3,
        longestStreak: 5,
        todayEntryLogged: true,
        todayBibleReference: 'Psalm 23',
      },
      yesterdaySummary: {
        startDate: '2026-06-13',
        endDate: '2026-06-13',
        clientGroups: [],
        protectedGroups: [],
        protectedDaySummaries: [],
        microBreaks: { count: 0, totalMinutes: 0 },
        longBreaks: { count: 0, totalMinutes: 0 },
        longBreakReasons: [],
        taskCompletionRate: null,
        scheduledTaskBlocks: 0,
        completedTaskBlocks: 0,
        checkInSummaries: [],
      },
      bumpedTasks: [],
    })

    expect(snapshot.blocks).toHaveLength(1)
    expect(snapshot.tasksByClient[0]?.pending).toHaveLength(1)
    expect(snapshot.tasksByClient[0]?.completed).toHaveLength(1)
    expect(snapshot.faith.todayEntryLogged).toBe(true)
    expect(snapshot.yesterdaySummary?.startDate).toBe('2026-06-13')
  })

  it('handles a day with no faith entry yet', () => {
    const snapshot = composeDailySnapshot({
      scheduleDate: '2026-06-14',
      generatedAt: '2026-06-14T08:00:00.000Z',
      blocks: [],
      tasks: [],
      clients: [client({ id: 1, name: 'Acme' })],
      stalenessSettings: { defaultStalenessHours: 48 },
      faith: {
        currentStreak: 2,
        longestStreak: 2,
        todayEntryLogged: false,
        todayBibleReference: null,
      },
      yesterdaySummary: null,
      bumpedTasks: [],
    })

    expect(snapshot.faith.todayEntryLogged).toBe(false)
    expect(snapshot.blocks).toHaveLength(0)
  })

  it('includes bumped tasks deferred after a long break reallocation', () => {
    const bumped = buildBumpedTasksFromRows(
      [
        {
          ...task({
            id: 9,
            title: 'Deferred task',
            deferred_to_date: '2026-06-15',
            updated_at: '2026-06-14T15:30:00.000Z',
          }),
          client_name: 'Acme',
        },
      ],
      '2026-06-14'
    )

    expect(bumped).toEqual([
      {
        id: 9,
        title: 'Deferred task',
        clientName: 'Acme',
        deferredToDate: '2026-06-15',
      },
    ])
  })
})
