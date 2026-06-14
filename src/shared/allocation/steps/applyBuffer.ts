import {
  addMinutes,
  createTempId,
  firstFitSegment,
  subtractInterval,
  toIsoLocal,
} from '../timeline'
import type { AllocationState, ScheduleBlock } from '../types'

export function applyBuffer(
  state: AllocationState,
  bufferPercent: number,
  scheduleDate: string
): { state: AllocationState; bufferMinutes: number } {
  const freeMinutes = state.freeIntervals.reduce(
    (sum, interval) =>
      sum + Math.round((interval.end.getTime() - interval.start.getTime()) / 60_000),
    0
  )

  const bufferMinutes = Math.floor((freeMinutes * bufferPercent) / 100)
  if (bufferMinutes <= 0) {
    return { state, bufferMinutes: 0 }
  }

  const winddown = [...state.blocks]
    .filter((block) => block.protectedSubtype === 'winddown')
    .sort((left, right) => left.plannedStart.localeCompare(right.plannedStart))[0]

  let freeIntervals = [...state.freeIntervals]
  const blocks = [...state.blocks]
  const warnings = [...state.warnings]

  let segmentStart: Date | null = null

  if (winddown) {
    const winddownStart = new Date(winddown.plannedStart)
    for (const interval of freeIntervals) {
      if (interval.end <= winddownStart) {
        const available = Math.round((interval.end.getTime() - interval.start.getTime()) / 60_000)
        if (available >= bufferMinutes) {
          segmentStart = addMinutes(winddownStart, -bufferMinutes)
          if (segmentStart >= interval.start) {
            break
          }
          segmentStart = null
        }
      }
    }
  }

  if (!segmentStart) {
    const fit = firstFitSegment(freeIntervals, bufferMinutes)
    if (!fit) {
      warnings.push('Buffer block could not be placed; buffer minutes remain unallocated')
      return { state: { ...state, warnings }, bufferMinutes: 0 }
    }
    segmentStart = fit.segment.start
  }

  const segmentEnd = addMinutes(segmentStart, bufferMinutes)
  const block: ScheduleBlock = {
    tempId: createTempId('buffer'),
    scheduleDate,
    blockType: 'buffer',
    title: 'Buffer',
    plannedStart: toIsoLocal(segmentStart),
    plannedEnd: toIsoLocal(segmentEnd),
    plannedDurationMinutes: bufferMinutes,
  }

  blocks.push(block)
  freeIntervals = subtractInterval(freeIntervals, { start: segmentStart, end: segmentEnd })

  return {
    state: { ...state, blocks, freeIntervals, warnings },
    bufferMinutes,
  }
}
