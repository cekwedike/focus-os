import { describe, expect, it } from 'vitest'
import { calculateFaithStreaks, formatStreakDays } from '../../src/shared/utils/faithStreak'

describe('formatStreakDays', () => {
  it('uses singular Day for 1', () => {
    expect(formatStreakDays(1)).toBe('1 Day')
  })

  it('uses plural Days for 0 and 2+', () => {
    expect(formatStreakDays(0)).toBe('0 Days')
    expect(formatStreakDays(2)).toBe('2 Days')
    expect(formatStreakDays(10)).toBe('10 Days')
  })
})

describe('calculateFaithStreaks', () => {
  it('returns zero streaks when there are no entries', () => {
    expect(calculateFaithStreaks([], '2026-06-14')).toEqual({
      currentStreak: 0,
      longestStreak: 0,
    })
  })

  it('counts an unbroken current streak through today', () => {
    const entries = [
      { entry_date: '2026-06-12', bible_reference: 'John 3:16' },
      { entry_date: '2026-06-13', bible_reference: 'Psalm 23' },
      { entry_date: '2026-06-14', bible_reference: 'Romans 8:28' },
    ]

    expect(calculateFaithStreaks(entries, '2026-06-14')).toEqual({
      currentStreak: 3,
      longestStreak: 3,
    })
  })

  it('breaks the current streak after a gap day', () => {
    const entries = [
      { entry_date: '2026-06-10', bible_reference: 'Genesis 1:1' },
      { entry_date: '2026-06-12', bible_reference: 'Matthew 5:1' },
      { entry_date: '2026-06-13', bible_reference: 'Luke 2:11' },
    ]

    expect(calculateFaithStreaks(entries, '2026-06-14')).toEqual({
      currentStreak: 2,
      longestStreak: 2,
    })
  })

  it('keeps yesterday streak when today is not logged yet', () => {
    const entries = [
      { entry_date: '2026-06-12', bible_reference: 'John 1:1' },
      { entry_date: '2026-06-13', bible_reference: 'John 1:2' },
    ]

    expect(calculateFaithStreaks(entries, '2026-06-14')).toEqual({
      currentStreak: 2,
      longestStreak: 2,
    })
  })

  it('tracks longest streak separately when it exceeds the current streak', () => {
    const entries = [
      { entry_date: '2026-06-01', bible_reference: 'A' },
      { entry_date: '2026-06-02', bible_reference: 'B' },
      { entry_date: '2026-06-03', bible_reference: 'C' },
      { entry_date: '2026-06-04', bible_reference: 'D' },
      { entry_date: '2026-06-10', bible_reference: 'E' },
      { entry_date: '2026-06-11', bible_reference: 'F' },
    ]

    expect(calculateFaithStreaks(entries, '2026-06-14')).toEqual({
      currentStreak: 0,
      longestStreak: 4,
    })
  })

  it('ignores entries without a bible reference', () => {
    const entries = [
      { entry_date: '2026-06-13', bible_reference: ' ' },
      { entry_date: '2026-06-14', bible_reference: 'Hebrews 11:1' },
    ]

    expect(calculateFaithStreaks(entries, '2026-06-14')).toEqual({
      currentStreak: 1,
      longestStreak: 1,
    })
  })
})
