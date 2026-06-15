import { describe, expect, it } from 'vitest'
import {
  buildLocalScheduleInstant,
  extractLocalTimeHHMM,
  formatScheduleInstant,
  isLocalScheduleInstant,
  normalizeScheduleInstant,
  parseScheduleInstant,
  shiftScheduleInstant,
} from '../../src/shared/utils/scheduleTimestamp'

describe('scheduleTimestamp', () => {
  it('formats local wall-clock instants without timezone suffix', () => {
    const date = new Date(2026, 5, 15, 20, 54, 0)
    expect(formatScheduleInstant(date)).toBe('2026-06-15T20:54:00')
    expect(isLocalScheduleInstant('2026-06-15T20:54:00')).toBe(true)
    expect(isLocalScheduleInstant('2026-06-15T20:54:00.000Z')).toBe(false)
  })

  it('normalizes UTC-suffixed values to local wall-clock format', () => {
    const utc = '2026-06-15T18:10:00.000Z'
    const normalized = normalizeScheduleInstant(utc)
    expect(normalized).toBe(formatScheduleInstant(new Date(utc)))
    expect(isLocalScheduleInstant(normalized)).toBe(true)
  })

  it('shifts instants in local format without introducing Z suffix', () => {
    const start = '2026-06-15T09:00:00'
    const shifted = shiftScheduleInstant(start, 5)
    expect(shifted).toBe('2026-06-15T09:05:00')
    expect(isLocalScheduleInstant(shifted)).toBe(true)
  })

  it('builds schedule instants from date and HH:MM', () => {
    expect(buildLocalScheduleInstant('2026-06-15', '09:30')).toBe('2026-06-15T09:30:00')
  })

  it('extracts local HH:MM for display', () => {
    const iso = buildLocalScheduleInstant('2026-06-15', '14:45')
    expect(extractLocalTimeHHMM(iso)).toBe('14:45')
    expect(extractLocalTimeHHMM(normalizeScheduleInstant('2026-06-15T12:45:00.000Z'))).toBe(
      extractLocalTimeHHMM(formatScheduleInstant(parseScheduleInstant('2026-06-15T12:45:00.000Z')))
    )
  })
})
