import { describe, expect, it } from 'vitest'
import { buildScheduleCard } from '../../src/shared/chat/attachments/buildScheduleCard'
import { buildTaskSummaryCard } from '../../src/shared/chat/attachments/buildTaskSummaryCard'
import { buildFaithStreakCard } from '../../src/shared/chat/attachments/buildFaithStreakCard'
import { buildFocusScoreCard } from '../../src/shared/chat/attachments/buildFocusScoreCard'
import { buildPlannedVsActualCard } from '../../src/shared/chat/attachments/buildPlannedVsActualCard'
import type { ChatMessage } from '../../src/shared/types/chat'

describe('attachment shapers', () => {
  it('builds schedule card payload', () => {
    const attachment = buildScheduleCard(
      [
        {
          id: 1,
          title: 'Client A',
          status: 'planned',
          block_type: 'fixed_client',
          protected_subtype: null,
          planned_start: '2026-06-15T09:00:00',
          planned_end: '2026-06-15T10:00:00',
        },
      ],
      { highlightBlockId: 1 }
    )

    expect(attachment.type).toBe('schedule_card')
    expect(attachment.blocks).toHaveLength(1)
    expect(attachment.highlightBlockId).toBe(1)
  })

  it('builds task summary card payload', () => {
    const attachment = buildTaskSummaryCard([
      {
        id: 2,
        title: 'Invoice',
        client_name: 'Acme',
        priority: 1,
        deadline_date: '2026-06-16',
        status: 'open',
      },
    ])

    expect(attachment.tasks[0].clientName).toBe('Acme')
  })

  it('builds faith streak card payload', () => {
    const attachment = buildFaithStreakCard({
      currentStreak: 3,
      longestStreak: 10,
      todayLogged: true,
      entriesThisMonth: 5,
    })

    expect(attachment.currentStreak).toBe(3)
    expect(attachment.todayLogged).toBe(true)
  })

  it('builds focus score card payload', () => {
    const attachment = buildFocusScoreCard(
      [
        {
          id: 1,
          schedule_date: '2026-06-15',
          title: 'Work',
          block_type: 'fixed_client',
          protected_subtype: null,
          client_id: 1,
          task_id: null,
          status: 'completed',
          planned_start: '2026-06-15T09:00:00',
          planned_end: '2026-06-15T10:00:00',
          planned_duration_minutes: 60,
          actual_start: '2026-06-15T09:00:00',
          actual_end: '2026-06-15T10:00:00',
          actual_duration_minutes: 60,
          priority_order: 1,
          metadata_json: null,
          created_at: '',
          updated_at: '',
        },
        {
          id: 2,
          schedule_date: '2026-06-15',
          title: 'Work 2',
          block_type: 'fixed_client',
          protected_subtype: null,
          client_id: 1,
          task_id: null,
          status: 'planned',
          planned_start: '2026-06-15T10:00:00',
          planned_end: '2026-06-15T11:00:00',
          planned_duration_minutes: 60,
          actual_start: null,
          actual_end: null,
          actual_duration_minutes: null,
          priority_order: 2,
          metadata_json: null,
          created_at: '',
          updated_at: '',
        },
      ],
      null
    )

    expect(attachment.score).toBe(50)
    expect(attachment.completedBlocks).toBe(1)
    expect(attachment.totalWorkBlocks).toBe(2)
  })

  it('builds planned vs actual card payload', () => {
    const attachment = buildPlannedVsActualCard(
      [
        {
          id: '1',
          label: 'Acme',
          plannedMinutes: 120,
          actualMinutes: 90,
          notStartedCount: 0,
          completedCount: 1,
        },
      ],
      '2026-06-15'
    )

    expect(attachment.rows[0].actualMinutes).toBe(90)
    expect(attachment.dateLabel).toBe('2026-06-15')
  })
})

describe('chat attachment serialization', () => {
  it('round-trips all attachment types through JSON', () => {
    const message: ChatMessage = {
      id: 'm1',
      role: 'assistant',
      content: 'Summary',
      timestamp: '2026-06-15T12:00:00.000Z',
      attachments: [
        buildScheduleCard([]),
        buildTaskSummaryCard([]),
        buildFaithStreakCard({
          currentStreak: 1,
          longestStreak: 2,
          todayLogged: false,
        }),
        buildFocusScoreCard([], null),
        buildPlannedVsActualCard([], '2026-06-15'),
      ],
    }

    const restored = JSON.parse(JSON.stringify(message)) as ChatMessage
    expect(restored.attachments).toHaveLength(5)
    expect(restored.attachments?.map((item) => item.type)).toEqual([
      'schedule_card',
      'task_summary_card',
      'faith_streak_card',
      'focus_score_card',
      'planned_vs_actual_card',
    ])
  })
})
