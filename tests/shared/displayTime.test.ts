import { describe, expect, it } from 'vitest'
import {
  formatClockTime,
  formatDateLabel,
  formatHHMM,
  from12HourParts,
  parseHHMM,
  to12HourParts,
} from '@shared/utils/displayTime'

describe('displayTime utilities', () => {
  it('formats HH:MM in 24-hour mode', () => {
    expect(formatHHMM('14:30', '24h')).toBe('14:30')
  })

  it('formats HH:MM in 12-hour mode', () => {
    expect(formatHHMM('14:30', '12h')).toBe('2:30 PM')
    expect(formatHHMM('00:15', '12h')).toBe('12:15 AM')
    expect(formatHHMM('12:00', '12h')).toBe('12:00 PM')
  })

  it('converts between 12-hour parts and HH:MM', () => {
    expect(from12HourParts(2, 30, 'PM')).toBe('14:30')
    expect(from12HourParts(12, 0, 'AM')).toBe('00:00')
    expect(to12HourParts(parseHHMM('23:45').hours24)).toEqual({ hour12: 11, period: 'PM' })
  })

  it('formats clock time for both modes', () => {
    const date = new Date(2026, 5, 14, 15, 5, 9)
    expect(formatClockTime(date, '24h')).toBe('15:05:09')
    expect(formatClockTime(date, '12h', false)).toBe('3:05 PM')
  })

  it('formats date labels', () => {
    const date = new Date(2026, 5, 14)
    expect(formatDateLabel(date, 'mdy')).toBe('06/14/2026')
    expect(formatDateLabel(date, 'dmy')).toBe('14/06/2026')
    expect(formatDateLabel(date, 'ymd')).toBe('2026-06-14')
  })
})
