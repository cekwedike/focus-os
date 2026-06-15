import { describe, expect, it } from 'vitest'
import { allocateDay } from '@shared/allocation'
import { computeFlexibleMinutes, resolveBufferMinutes } from '@shared/allocation/flexiblePool'
import {
  baseInput,
  clientWithFixedBlock,
  SCHEDULE_DATE,
  WAKE_TIME,
} from './fixtures'
import type { ClientInput, ProtectedBlockTemplate } from '@shared/allocation/types'

function protectedBlock(
  overrides: Partial<ProtectedBlockTemplate> & Pick<ProtectedBlockTemplate, 'durationMinutes'>
): ProtectedBlockTemplate {
  return {
    id: 1,
    blockType: 'morning_routine',
    label: 'Block',
    anchorType: 'wake_offset',
    anchorValue: '0',
    sortOrder: 0,
    isEnabled: true,
    ...overrides,
  }
}

function fixedClient(durationMinutes: number, start = '10:00'): ClientInput[] {
  return [
    {
      id: 1,
      name: 'Fixed Client',
      weightPercent: 100,
      isActive: true,
      fixedBlockEnabled: true,
      fixedBlockStart: start,
      fixedBlockDurationMinutes: durationMinutes,
      sortOrder: 0,
    },
  ]
}

describe('flexiblePool helpers', () => {
  it('resolves buffer minutes with cap and distributable remainder', () => {
    expect(resolveBufferMinutes(400, 20, 60)).toEqual({
      bufferMinutes: 60,
      distributableMinutes: 340,
    })
  })

  it('returns zero buffer when flexible time is exhausted', () => {
    expect(resolveBufferMinutes(0, 10, 60)).toEqual({
      bufferMinutes: 0,
      distributableMinutes: 0,
    })
  })
})

describe('allocateDay buffer sizing', () => {
  it('uses percent of flexible time when capacity is set (600 cap, 120 protected, 240 fixed, 10%)', () => {
    const output = allocateDay(
      baseInput({
        capacityMinutes: 600,
        bufferPercent: 10,
        protectedBlocks: [protectedBlock({ id: 1, durationMinutes: 120 })],
        clients: fixedClient(240),
        tasks: [],
      })
    )

    const buffer = output.blocks.find((block) => block.blockType === 'buffer')
    expect(buffer?.plannedDurationMinutes).toBe(24)
  })

  it('uses flexible time minus protected when no fixed blocks (480 cap, 85 protected, 10%)', () => {
    const output = allocateDay(
      baseInput({
        capacityMinutes: 480,
        bufferPercent: 10,
        clients: [],
        tasks: [],
      })
    )

    const protectedMinutes = output.metadata.totalProtectedMinutes
    expect(protectedMinutes).toBe(85)

    const buffer = output.blocks.find((block) => block.blockType === 'buffer')
    expect(buffer?.plannedDurationMinutes).toBe(Math.floor((480 - protectedMinutes) * 0.1))
  })

  it('floors buffer at zero when protected and fixed exceed capacity', () => {
    const output = allocateDay(
      baseInput({
        capacityMinutes: 300,
        bufferPercent: 10,
        protectedBlocks: [protectedBlock({ id: 1, durationMinutes: 200 })],
        clients: fixedClient(150, '11:00'),
        tasks: [],
      })
    )

    const buffer = output.blocks.find((block) => block.blockType === 'buffer')
    expect(buffer).toBeUndefined()
    expect(output.metadata.bufferMinutes).toBe(0)
  })

  it('clamps buffer to maxBufferMinutes and redistributes excess to weighted clients', () => {
    const output = allocateDay(
      baseInput({
        capacityMinutes: 600,
        bufferPercent: 20,
        maxBufferMinutes: 60,
        protectedBlocks: [protectedBlock({ id: 1, durationMinutes: 120 })],
        clients: [
          {
            id: 1,
            name: 'Client A',
            weightPercent: 100,
            isActive: true,
            fixedBlockEnabled: false,
            sortOrder: 0,
          },
        ],
        tasks: [],
      })
    )

    const buffer = output.blocks.find((block) => block.blockType === 'buffer')
    expect(buffer?.plannedDurationMinutes).toBe(60)

    const weightedMinutes = output.metadata.totalWeightedMinutes
    const flexible = 600 - 120
    expect(weightedMinutes).toBeLessThanOrEqual(flexible - 60)
    expect(weightedMinutes).toBeGreaterThan(0)
  })

  it('keeps buffer under 90 minutes at 20% buffer on a 10-hour capacity day', () => {
    const output = allocateDay(
      baseInput({
        capacityMinutes: 600,
        bufferPercent: 20,
        maxBufferMinutes: 60,
        protectedBlocks: [
          protectedBlock({ id: 1, durationMinutes: 60 }),
          protectedBlock({ id: 2, blockType: 'faith', durationMinutes: 60, sortOrder: 1 }),
        ],
        clients: [],
        tasks: [],
      })
    )

    const buffer = output.blocks.find((block) => block.blockType === 'buffer')
    expect(buffer?.plannedDurationMinutes ?? 0).toBeLessThanOrEqual(90)
  })

  it('falls back to timeline free gaps when capacityMinutes is omitted', () => {
    const stateLike = {
      blocks: [],
      freeIntervals: [{ start: new Date(WAKE_TIME), end: new Date('2026-06-14T12:00:00') }],
      warnings: [],
      taskQueue: [],
    }

    expect(computeFlexibleMinutes(stateLike, undefined)).toBe(300)
  })

  it('uses gap-sum flexible pool in allocateDay when capacityMinutes is omitted', () => {
    const output = allocateDay(
      baseInput({
        clients: [],
        tasks: [],
        bufferPercent: 10,
        protectedBlocks: [],
      })
    )

    const dayWindowMinutes = 16 * 60
    const expectedFlexible = dayWindowMinutes
    const buffer = output.blocks.find((block) => block.blockType === 'buffer')
    expect(buffer?.plannedDurationMinutes).toBe(Math.floor(expectedFlexible * 0.1))
  it('matches clientWithFixedBlock fixture without buffer inflation', () => {
    const output = allocateDay(
      baseInput({
        clients: clientWithFixedBlock(),
        tasks: [],
        protectedBlocks: [],
        capacityMinutes: 600,
        bufferPercent: 10,
      })
    )

    const fixed = output.blocks.find((block) => block.blockType === 'fixed_client')
    const buffer = output.blocks.find((block) => block.blockType === 'buffer')
    expect(fixed?.plannedDurationMinutes).toBe(90)
    expect(buffer?.plannedDurationMinutes).toBe(Math.floor((600 - 90) * 0.1))
  })
})
