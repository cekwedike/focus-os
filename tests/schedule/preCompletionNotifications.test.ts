import { describe, expect, it } from 'vitest'
import {
  computePreCompletionFireAtMs,
  getDuePreCompletionThreshold,
  recalculateFiredThresholds,
} from '../../src/shared/schedule/preCompletionNotifications'

describe('preCompletionNotifications', () => {
  const plannedEnd = '2026-06-15T13:00:00.000Z'

  it('computes fire times at 15, 10, and 5 minutes before planned end', () => {
    expect(computePreCompletionFireAtMs(plannedEnd, 15)).toBe(
      new Date('2026-06-15T12:45:00.000Z').getTime()
    )
    expect(computePreCompletionFireAtMs(plannedEnd, 10)).toBe(
      new Date('2026-06-15T12:50:00.000Z').getTime()
    )
    expect(computePreCompletionFireAtMs(plannedEnd, 5)).toBe(
      new Date('2026-06-15T12:55:00.000Z').getTime()
    )
  })

  it('returns the earliest due threshold that has not fired', () => {
    const nowMs = new Date('2026-06-15T12:51:00.000Z').getTime()
    const due = getDuePreCompletionThreshold(plannedEnd, nowMs, new Set())
    expect(due).toBe(15)
  })

  it('recalculates fired thresholds after extend moves warnings into the future', () => {
    const newEnd = '2026-06-15T13:05:00.000Z'
    const nowMs = new Date('2026-06-15T12:46:00.000Z').getTime()
    const fired = new Set([15] as const)

    const next = recalculateFiredThresholds(newEnd, nowMs, fired)
    expect(next.has(15)).toBe(false)
    expect(getDuePreCompletionThreshold(newEnd, nowMs, next)).toBeNull()
  })
})
