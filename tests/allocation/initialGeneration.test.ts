import { describe, expect, it } from 'vitest'
import { allocateDay } from '@shared/allocation'
import {
  addMinutes,
  getDayWindow,
  intervalFromStartDuration,
  overlaps,
  parseIsoLocal,
  subtractInterval,
} from '@shared/allocation/timeline'
import {
  baseInput,
  clientWithFixedBlock,
  defaultClients,
  manyTasks,
  overlappingProtectedBlocks,
  sampleTasks,
  SCHEDULE_DATE,
  WAKE_TIME,
} from './fixtures'

describe('timeline utilities', () => {
  it('computes day window from wake to sleep', () => {
    const window = getDayWindow(SCHEDULE_DATE, WAKE_TIME, '23:00')
    expect(window).not.toBeNull()
    expect(window!.start.getHours()).toBe(7)
    expect(window!.end.getHours()).toBe(23)
  })

  it('detects interval overlap', () => {
    const left = intervalFromStartDuration(parseIsoLocal(WAKE_TIME), 60)
    const right = intervalFromStartDuration(addMinutes(parseIsoLocal(WAKE_TIME), 30), 60)
    expect(overlaps(left, right)).toBe(true)
  })

  it('subtracts occupied time from free intervals', () => {
    const window = getDayWindow(SCHEDULE_DATE, WAKE_TIME, '23:00')!
    const occupied = intervalFromStartDuration(parseIsoLocal(WAKE_TIME), 60)
    const remaining = subtractInterval([window], occupied)
    expect(remaining.length).toBe(1)
    expect(remaining[0].start.getHours()).toBe(8)
  })
})

describe('allocateDay initial generation', () => {
  it('places protected blocks and client blocks without overlapping protected time', () => {
    const output = allocateDay(baseInput({ clients: defaultClients(), tasks: [] }))
    const protectedIntervals = output.blocks
      .filter((block) => block.blockType === 'protected')
      .map((block) => ({ start: block.plannedStart, end: block.plannedEnd }))
    const clientBlocks = output.blocks.filter(
      (block) => block.blockType === 'weighted_client' || block.blockType === 'fixed_client'
    )

    expect(protectedIntervals.length).toBeGreaterThan(0)
    expect(clientBlocks.length).toBeGreaterThan(0)

    for (const clientBlock of clientBlocks) {
      for (const protectedBlock of protectedIntervals) {
        const overlaps =
          clientBlock.plannedStart < protectedBlock.end &&
          protectedBlock.start < clientBlock.plannedEnd
        expect(overlaps).toBe(false)
      }
    }
  })

  it('places fixed client blocks when configured', () => {
    const output = allocateDay(
      baseInput({
        clients: clientWithFixedBlock(),
        tasks: [],
        protectedBlocks: [],
      })
    )

    const fixed = output.blocks.find((block) => block.blockType === 'fixed_client')
    expect(fixed).toBeDefined()
    expect(fixed!.plannedStart).toContain('T10:00:00')
    expect(fixed!.plannedDurationMinutes).toBe(90)

    const weighted = output.blocks.filter((block) => block.blockType === 'weighted_client')
    expect(weighted).toHaveLength(0)
  })

  it('shifts overlapping protected blocks forward by sort_order', () => {
    const output = allocateDay(
      baseInput({
        protectedBlocks: overlappingProtectedBlocks(),
        clients: [],
        tasks: [],
        bufferPercent: 0,
      })
    )

    const faith = output.blocks.find((block) => block.protectedSubtype === 'faith')
    const morning = output.blocks.find((block) => block.protectedSubtype === 'morning_routine')
    expect(morning).toBeDefined()
    expect(faith).toBeDefined()
    expect(faith!.plannedStart >= morning!.plannedEnd).toBe(true)
  })

  it('leaves overflow tasks in queue when block capacity is exceeded', () => {
    const output = allocateDay(
      baseInput({
        clients: [{ ...defaultClients()[0], weightPercent: 100 }],
        tasks: manyTasks(),
        bufferPercent: 0,
        protectedBlocks: [],
      })
    )

    const clientBlocks = output.blocks.filter((block) => block.blockType === 'weighted_client')
    const assignedCount = clientBlocks.filter((block) => block.taskId).length
    expect(assignedCount).toBeLessThan(manyTasks().length)
    expect(output.warnings.length).toBeGreaterThanOrEqual(0)
  })

  it('creates empty client blocks when client has zero tasks', () => {
    const output = allocateDay(baseInput({ tasks: [] }))
    const clientBlocks = output.blocks.filter((block) => block.blockType === 'weighted_client')
    expect(clientBlocks.length).toBeGreaterThan(0)
    expect(clientBlocks.some((block) => !block.taskId)).toBe(true)
  })

  it('normalizes weights that do not sum to 100', () => {
    const output = allocateDay(
      baseInput({
        clients: [
          { ...defaultClients()[0], weightPercent: 20 },
          { ...defaultClients()[1], weightPercent: 30 },
        ],
        tasks: [],
        bufferPercent: 0,
        protectedBlocks: [],
      })
    )

    const weighted = output.blocks.filter((block) => block.blockType === 'weighted_client')
    const totalMinutes = weighted.reduce((sum, block) => sum + block.plannedDurationMinutes, 0)
    const ratioA =
      weighted.find((block) => block.clientId === 1)!.plannedDurationMinutes / totalMinutes
    expect(ratioA).toBeCloseTo(0.4, 1)
  })

  it('orders task fill by priority then deadline', () => {
    const output = allocateDay(
      baseInput({
        clients: [{ ...defaultClients()[0], weightPercent: 100 }],
        tasks: sampleTasks().filter((task) => task.clientId === 1),
        bufferPercent: 0,
        protectedBlocks: [],
      })
    )

    const block = output.blocks.find((block) => block.clientId === 1 && block.taskId)
    expect(block?.taskId).toBe(1)
  })

  it('warns when wake time is after sleep target', () => {
    const output = allocateDay(
      baseInput({
        wakeTime: '2026-06-14T23:30:00',
        sleepTargetTime: '22:00',
      })
    )
    expect(output.blocks).toHaveLength(0)
    expect(output.warnings[0]).toContain('Wake time is after sleep target')
  })
})
