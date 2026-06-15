/**
 * Buffer sizing (Step 3):
 *   flexibleMinutes = capacity - protected - fixed  (or timeline gaps when capacity omitted)
 *   requestedBuffer = floor(flexibleMinutes * bufferPercent / 100)
 *   bufferMinutes   = min(requestedBuffer, maxBufferMinutes)
 *   weighted pool   = flexibleMinutes - bufferMinutes
 */
import { computeFlexibleMinutes, resolveBufferMinutes } from '../flexiblePool'
import {
  addMinutes,
  createTempId,
  firstFitSegment,
  minutesBetween,
  subtractInterval,
  toIsoLocal,
} from '../timeline'
import type { AllocationState, ScheduleBlock } from '../types'

export interface ApplyBufferOptions {
  bufferPercent: number
  maxBufferMinutes: number
  capacityMinutes?: number
}

export interface ApplyBufferResult {
  state: AllocationState
  bufferMinutes: number
  distributableMinutes: number
}

export function applyBuffer(
  state: AllocationState,
  scheduleDate: string,
  options: ApplyBufferOptions
): ApplyBufferResult {
  const flexibleMinutes = computeFlexibleMinutes(state, options.capacityMinutes)
  const { bufferMinutes: targetBufferMinutes, distributableMinutes } = resolveBufferMinutes(
    flexibleMinutes,
    options.bufferPercent,
    options.maxBufferMinutes
  )

  if (targetBufferMinutes <= 0) {
    return { state, bufferMinutes: 0, distributableMinutes }
  }

  const winddown = [...state.blocks]
    .filter((block) => block.protectedSubtype === 'winddown')
    .sort((left, right) => left.plannedStart.localeCompare(right.plannedStart))[0]

  let freeIntervals = [...state.freeIntervals]
  const blocks = [...state.blocks]
  const warnings = [...state.warnings]

  let segmentStart: Date | null = null
  let placedMinutes = targetBufferMinutes

  if (winddown) {
    const winddownStart = new Date(winddown.plannedStart)
    for (const interval of freeIntervals) {
      if (interval.end <= winddownStart) {
        const available = minutesBetween(interval.start, interval.end)
        if (available >= targetBufferMinutes) {
          segmentStart = addMinutes(winddownStart, -targetBufferMinutes)
          if (segmentStart >= interval.start) {
            break
          }
          segmentStart = null
        } else if (available > 0 && available < targetBufferMinutes) {
          segmentStart = interval.start
          placedMinutes = available
          break
        }
      }
    }
  }

  if (!segmentStart) {
    const fit = firstFitSegment(freeIntervals, targetBufferMinutes)
    if (fit) {
      segmentStart = fit.segment.start
      placedMinutes = targetBufferMinutes
    } else {
      const largest = findLargestFreeSegment(freeIntervals)
      if (largest && largest.duration > 0) {
        segmentStart = largest.segment.start
        placedMinutes = largest.duration
        warnings.push(
          `Buffer shortened from ${targetBufferMinutes} to ${placedMinutes} minutes to fit available time`
        )
      } else {
        warnings.push('Buffer block could not be placed; buffer minutes remain unallocated')
        return {
          state: { ...state, warnings },
          bufferMinutes: 0,
          distributableMinutes: flexibleMinutes,
        }
      }
    }
  }

  const segmentEnd = addMinutes(segmentStart, placedMinutes)
  const block: ScheduleBlock = {
    tempId: createTempId('buffer'),
    scheduleDate,
    blockType: 'buffer',
    title: 'Buffer',
    plannedStart: toIsoLocal(segmentStart),
    plannedEnd: toIsoLocal(segmentEnd),
    plannedDurationMinutes: placedMinutes,
  }

  blocks.push(block)
  freeIntervals = subtractInterval(freeIntervals, { start: segmentStart, end: segmentEnd })

  const returnedToWeighted = targetBufferMinutes - placedMinutes

  return {
    state: { ...state, blocks, freeIntervals, warnings },
    bufferMinutes: placedMinutes,
    distributableMinutes: distributableMinutes + returnedToWeighted,
  }
}

function findLargestFreeSegment(
  freeIntervals: import('../timeline').TimeInterval[]
): { segment: import('../timeline').TimeInterval; duration: number } | null {
  let best: { segment: import('../timeline').TimeInterval; duration: number } | null = null

  for (const interval of freeIntervals) {
    const duration = minutesBetween(interval.start, interval.end)
    if (duration > 0 && (!best || duration > best.duration)) {
      best = { segment: interval, duration }
    }
  }

  return best
}
