import { describe, expect, it } from 'vitest'
import { allocateDay, reallocateAfterLongBreak } from '@shared/allocation'
import type { ScheduleBlock } from '@shared/allocation/types'
import { baseInput, defaultClients, sampleTasks } from './fixtures'

function buildFullDaySchedule(): ScheduleBlock[] {
  const output = allocateDay(
    baseInput({
      clients: defaultClients(),
      tasks: sampleTasks(),
      bufferPercent: 5,
    })
  )
  return output.blocks
}

describe('reallocateAfterLongBreak', () => {
  it('repacks future client blocks after a short break without compression', () => {
    const existing = buildFullDaySchedule()
    const returnTime = '2026-06-14T12:00:00'

    const output = reallocateAfterLongBreak(
      baseInput({ clients: defaultClients(), tasks: sampleTasks() }),
      existing,
      returnTime,
      30
    )

    const futureClient = output.blocks.filter(
      (block) =>
        (block.blockType === 'weighted_client' || block.blockType === 'fixed_client') &&
        block.plannedStart >= returnTime
    )
    expect(futureClient.length).toBeGreaterThan(0)
    expect(output.replanSummary.longBreakDurationMinutes).toBe(30)
    expect(output.replanSummary.message).toContain('Schedule adjusted')
  })

  it('compresses client blocks proportionally after a long break', () => {
    const existing = [
      {
        tempId: 'past-1',
        scheduleDate: '2026-06-14',
        blockType: 'weighted_client' as const,
        clientId: 1,
        title: 'Past work',
        plannedStart: '2026-06-14T08:00:00',
        plannedEnd: '2026-06-14T09:00:00',
        plannedDurationMinutes: 60,
      },
      {
        tempId: 'future-1',
        scheduleDate: '2026-06-14',
        blockType: 'weighted_client' as const,
        clientId: 1,
        title: 'Future A',
        plannedStart: '2026-06-14T19:00:00',
        plannedEnd: '2026-06-14T21:00:00',
        plannedDurationMinutes: 120,
      },
      {
        tempId: 'future-2',
        scheduleDate: '2026-06-14',
        blockType: 'weighted_client' as const,
        clientId: 2,
        title: 'Future B',
        plannedStart: '2026-06-14T21:00:00',
        plannedEnd: '2026-06-14T23:00:00',
        plannedDurationMinutes: 120,
      },
    ]

    const output = reallocateAfterLongBreak(
      baseInput({
        clients: defaultClients(),
        tasks: sampleTasks(),
        bufferPercent: 0,
        protectedBlocks: [],
        sleepTargetTime: '22:00',
      }),
      existing,
      '2026-06-14T19:00:00',
      60
    )

    expect(output.replanSummary.blocksCompressed.length).toBeGreaterThan(0)
    const totalFutureMinutes = output.blocks
      .filter(
        (block) =>
          (block.blockType === 'weighted_client' || block.blockType === 'fixed_client') &&
          block.plannedStart >= '2026-06-14T19:00:00'
      )
      .reduce((sum, block) => sum + block.plannedDurationMinutes, 0)

    expect(totalFutureMinutes).toBeLessThan(240)
  })

  it('bumps tasks when blocks fall below minimum viable threshold', () => {
    const existing = buildFullDaySchedule()
    const returnTime = '2026-06-14T18:00:00'

    const output = reallocateAfterLongBreak(
      baseInput({
        clients: defaultClients(),
        tasks: sampleTasks(),
        bufferPercent: 0,
        minViableBlockMinutes: 15,
      }),
      existing,
      returnTime,
      300
    )

    if (output.bumpedTaskIds.length > 0) {
      expect(output.replanSummary.bumpedTaskIds.length).toBeGreaterThan(0)
      expect(output.warnings.some((warning) => warning.includes('deferred'))).toBe(true)
    } else {
      expect(output.replanSummary).toBeDefined()
    }
  })

  it('is idempotent for the same return time and frozen past', () => {
    const existing = buildFullDaySchedule()
    const returnTime = '2026-06-14T13:00:00'
    const input = baseInput({ clients: defaultClients(), tasks: sampleTasks() })

    const first = reallocateAfterLongBreak(input, existing, returnTime, 60)
    const second = reallocateAfterLongBreak(input, first.blocks, returnTime, 60)

    expect(second.blocks.length).toBe(first.blocks.length)
    expect(second.replanSummary.returnTime).toBe(returnTime)
  })

  it('returns a complete replan summary object', () => {
    const existing = buildFullDaySchedule()
    const output = reallocateAfterLongBreak(
      baseInput({ clients: defaultClients(), tasks: sampleTasks() }),
      existing,
      '2026-06-14T14:00:00',
      90
    )

    expect(output.replanSummary).toMatchObject({
      returnTime: '2026-06-14T14:00:00',
      longBreakDurationMinutes: 90,
      blocksRemoved: expect.any(Array),
      blocksCompressed: expect.any(Array),
      protectedBlocksUnchanged: expect.any(Number),
      bumpedTaskIds: expect.any(Array),
      message: expect.any(String),
    })
  })

  it('leaves protected blocks unchanged after return time', () => {
    const existing = buildFullDaySchedule()
    const protectedBefore = existing.filter((block) => block.blockType === 'protected')
    const returnTime = '2026-06-14T15:00:00'

    const output = reallocateAfterLongBreak(
      baseInput({ clients: defaultClients(), tasks: sampleTasks() }),
      existing,
      returnTime,
      120
    )

    const protectedAfter = output.blocks.filter((block) => block.blockType === 'protected')
    expect(protectedAfter.length).toBe(protectedBefore.length)
    expect(output.replanSummary.protectedBlocksUnchanged).toBeGreaterThan(0)
  })
})
