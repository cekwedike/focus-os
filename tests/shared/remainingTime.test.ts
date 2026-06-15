import { describe, expect, it } from 'vitest'
import {
  computeCountdownSeconds,
  formatCountdown,
  formatCountdownFromMinutes,
  formatDurationProse,
} from '../../src/shared/utils/remainingTime'

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

describe('formatCountdown', () => {
  it('formats zero as 00:00', () => {
    expect(formatCountdown(0)).toBe('00:00')
  })

  it('formats under one minute with leading zeros', () => {
    expect(formatCountdown(45)).toBe('00:45')
  })

  it('formats minutes and seconds with leading zeros', () => {
    expect(formatCountdown(125)).toBe('02:05')
  })

  it('formats exactly 60 minutes as 1:00:00', () => {
    expect(formatCountdown(3600)).toBe('1:00:00')
  })

  it('formats multi-hour durations as H:MM:SS', () => {
    expect(formatCountdown(25080)).toBe('6:58:00')
    expect(formatCountdown(36000)).toBe('10:00:00')
  })

  it('prefixes overdue sub-hour values with a minus sign', () => {
    expect(formatCountdown(-305)).toBe('-05:05')
  })

  it('prefixes overdue multi-hour values with a minus sign', () => {
    expect(formatCountdown(-5025)).toBe('-1:23:45')
  })
})

describe('formatCountdownFromMinutes', () => {
  it('converts minutes to countdown display', () => {
    expect(formatCountdownFromMinutes(418)).toBe('6:58:00')
    expect(formatCountdownFromMinutes(30)).toBe('30:00')
  })
})

describe('formatDurationProse', () => {
  it('formats sub-hour durations in minutes', () => {
    expect(formatDurationProse(1)).toBe('1 minute')
    expect(formatDurationProse(45)).toBe('45 minutes')
  })

  it('formats multi-hour durations with hours and minutes', () => {
    expect(formatDurationProse(418)).toBe('6 hours 58 minutes')
    expect(formatDurationProse(120)).toBe('2 hours')
  })
})
