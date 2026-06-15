import { countFixedClientMinutes } from './steps/placeFixedClientBlocks'
import { countProtectedMinutes } from './steps/placeProtectedBlocks'
import { totalMinutes } from './timeline'
import type { AllocationState } from './types'

/**
 * Flexible time is the pool shared between buffer and weighted client blocks.
 *
 * When capacityMinutes is provided (remaining_minutes_at_wake / total_capacity_hours):
 *   flexibleMinutes = max(0, capacityMinutes - protectedMinutes - fixedMinutes)
 *
 * When capacityMinutes is omitted (unit tests / legacy callers):
 *   flexibleMinutes = sum of timeline free gaps after protected and fixed placement
 */
export function computeFlexibleMinutes(
  state: AllocationState,
  capacityMinutes?: number
): number {
  const protectedMinutes = countProtectedMinutes(state.blocks)
  const fixedMinutes = countFixedClientMinutes(state.blocks)

  if (capacityMinutes !== undefined) {
    return Math.max(0, capacityMinutes - protectedMinutes - fixedMinutes)
  }

  return totalMinutes(state.freeIntervals)
}

export interface BufferResolution {
  bufferMinutes: number
  distributableMinutes: number
}

/**
 * Buffer takes bufferPercent of flexible time, capped at maxBufferMinutes.
 * Remaining flexible minutes go to weighted client allocation.
 */
export function resolveBufferMinutes(
  flexibleMinutes: number,
  bufferPercent: number,
  maxBufferMinutes: number
): BufferResolution {
  if (flexibleMinutes <= 0 || bufferPercent <= 0) {
    return {
      bufferMinutes: 0,
      distributableMinutes: Math.max(0, flexibleMinutes),
    }
  }

  const requested = Math.floor((flexibleMinutes * bufferPercent) / 100)
  const bufferMinutes = Math.min(requested, maxBufferMinutes)

  return {
    bufferMinutes,
    distributableMinutes: Math.max(0, flexibleMinutes - bufferMinutes),
  }
}
