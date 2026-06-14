import { describe, expect, it } from 'vitest'
import { analyzeBreaks } from '../../src/shared/review/breakAnalysis'

describe('analyzeBreaks', () => {
  it('returns zero totals when there are no breaks', () => {
    expect(analyzeBreaks([])).toEqual({
      microBreaks: { count: 0, totalMinutes: 0 },
      longBreaks: { count: 0, totalMinutes: 0 },
      longBreakReasons: [],
    })
  })

  it('aggregates micro and long break totals', () => {
    const result = analyzeBreaks([
      { break_type: 'micro', reason: null, duration_minutes: 5 },
      { break_type: 'micro', reason: null, duration_minutes: 5 },
      { break_type: 'long', reason: 'Lunch', duration_minutes: 30 },
    ])

    expect(result.microBreaks).toEqual({ count: 2, totalMinutes: 10 })
    expect(result.longBreaks).toEqual({ count: 1, totalMinutes: 30 })
    expect(result.longBreakReasons).toEqual([
      { reason: 'Lunch', count: 1, totalMinutes: 30 },
    ])
  })

  it('groups repeated long break reasons', () => {
    const result = analyzeBreaks([
      { break_type: 'long', reason: 'Errands', duration_minutes: 20 },
      { break_type: 'long', reason: 'Errands', duration_minutes: 15 },
      { break_type: 'long', reason: null, duration_minutes: 10 },
    ])

    expect(result.longBreakReasons).toEqual([
      { reason: 'Errands', count: 2, totalMinutes: 35 },
      { reason: 'No reason given', count: 1, totalMinutes: 10 },
    ])
  })
})
