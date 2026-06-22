import { describe, expect, it } from 'vitest'
import { allocateDay } from '@shared/allocation'
import type { AllocationInput } from '@shared/allocation/types'

const baseInput: AllocationInput = {
  scheduleDate: '2026-06-22',
  wakeTime: '2026-06-22T09:00:00',
  sleepTargetTime: '23:00',
  bufferPercent: 10,
  maxBufferMinutes: 60,
  minViableBlockMinutes: 15,
  protectedBlocks: [],
  clients: [
    {
      id: 1,
      name: 'CXU',
      weightPercent: 100,
      isActive: true,
      fixedBlockEnabled: false,
      sortOrder: 0,
    },
  ],
  tasks: [],
  calendarBlocks: [
    {
      externalId: 'gcal-1',
      title: 'Standup',
      startTime: '2026-06-22T14:00:00',
      endTime: '2026-06-22T14:30:00',
    },
  ],
}

describe('calendar-aware allocation', () => {
  it('places calendar events as immovable blocks', () => {
    const output = allocateDay(baseInput)
    const calendarBlock = output.blocks.find((block) => block.blockType === 'calendar')
    expect(calendarBlock).toBeDefined()
    expect(calendarBlock?.title).toBe('Standup')
  })
})
