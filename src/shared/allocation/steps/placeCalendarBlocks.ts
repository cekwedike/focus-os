import {
  createTempId,
  overlaps,
  parseIsoLocal,
  subtractInterval,
  toIsoLocal,
  type TimeInterval,
} from '../timeline'
import type { AllocationState, CalendarBlockInput, ScheduleBlock } from '../types'

export function placeCalendarBlocks(
  state: AllocationState,
  calendarBlocks: CalendarBlockInput[],
  scheduleDate: string
): AllocationState {
  const sorted = [...calendarBlocks].sort(
    (left, right) => left.startTime.localeCompare(right.startTime)
  )

  const blocks = [...state.blocks]
  const warnings = [...state.warnings]
  let freeIntervals = [...state.freeIntervals]

  for (const event of sorted) {
    const candidate: TimeInterval = {
      start: parseIsoLocal(event.startTime),
      end: parseIsoLocal(event.endTime),
    }

    if (candidate.end <= candidate.start) {
      continue
    }

    const collidesWithExisting = blocks.some((block) => {
      const blockInterval: TimeInterval = {
        start: parseIsoLocal(block.plannedStart),
        end: parseIsoLocal(block.plannedEnd),
      }
      return overlaps(candidate, blockInterval)
    })

    if (collidesWithExisting) {
      warnings.push(`Calendar event '${event.title}' overlaps an existing block`)
    }

    const durationMinutes = Math.round(
      (candidate.end.getTime() - candidate.start.getTime()) / 60_000
    )

    const block: ScheduleBlock = {
      tempId: createTempId('calendar'),
      scheduleDate,
      blockType: 'calendar',
      title: event.title,
      plannedStart: toIsoLocal(candidate.start),
      plannedEnd: toIsoLocal(candidate.end),
      plannedDurationMinutes: durationMinutes,
      metadataJson: {
        externalId: event.externalId,
        location: event.location ?? null,
      },
    }

    blocks.push(block)
    freeIntervals = subtractInterval(freeIntervals, candidate)
  }

  return { ...state, blocks, freeIntervals, warnings }
}

export function countCalendarMinutes(blocks: ScheduleBlock[]): number {
  return blocks
    .filter((block) => block.blockType === 'calendar')
    .reduce((sum, block) => sum + block.plannedDurationMinutes, 0)
}
