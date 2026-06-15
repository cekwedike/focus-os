import { describe, expect, it } from 'vitest'
import { computeCountdownSeconds, formatCountdownMmSs } from '../../src/shared/utils/remainingTime'

describe('computeCountdownSeconds', () => {
  it('counts down to a planned end time', () => {
    const nowMs = new Date('2026-06-15T10:30:00.000Z').getTime()
    const endsAt = '2026-06-15T11:00:00.000Z'

    expect(computeCountdownSeconds({ nowMs, endsAt })).toBe(30 * 60)
  })

  it('returns negative seconds after planned end', () => {
    const nowMs = new Date('2026-06-15T11:05:00.000Z').getTime()
    const endsAt = '2026-06-15T11:00:00.000Z'

    expect(computeCountdownSeconds({ nowMs, endsAt })).toBe(-5 * 60)
  })

  it('counts down from a fixed duration since start', () => {
    const startedAt = '2026-06-15T10:00:00.000Z'
    const nowMs = new Date('2026-06-15T10:15:00.000Z').getTime()

    expect(
      computeCountdownSeconds({
        nowMs,
        startedAt,
        durationMinutes: 30,
      })
    ).toBe(15 * 60)
  })

  it('returns negative seconds after a duration-based timer expires', () => {
    const startedAt = '2026-06-15T10:00:00.000Z'
    const nowMs = new Date('2026-06-15T10:35:00.000Z').getTime()

    expect(
      computeCountdownSeconds({
        nowMs,
        startedAt,
        durationMinutes: 30,
      })
    ).toBe(-5 * 60)
  })
})

describe('formatCountdownMmSs', () => {
  it('formats minutes and seconds with leading zeros', () => {
    expect(formatCountdownMmSs(125)).toBe('02:05')
  })

  it('prefixes overdue values with a minus sign', () => {
    expect(formatCountdownMmSs(-305)).toBe('-05:05')
  })
})
