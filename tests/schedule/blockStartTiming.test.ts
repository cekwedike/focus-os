import { describe, expect, it } from 'vitest'
import { isBlockStartDue } from '../../src/shared/schedule/blockStartTiming'

describe('isBlockStartDue', () => {
  const block = {
    status: 'planned',
    planned_start: '2026-06-15T09:00:00',
  }

  it('returns true when now is at or after planned start', () => {
    expect(isBlockStartDue(block, new Date('2026-06-15T09:00:00').getTime())).toBe(true)
    expect(isBlockStartDue(block, new Date('2026-06-15T10:00:00').getTime())).toBe(true)
  })

  it('returns false before planned start', () => {
    expect(isBlockStartDue(block, new Date('2026-06-15T08:59:59').getTime())).toBe(false)
  })

  it('returns false for non-planned blocks', () => {
    expect(
      isBlockStartDue({ ...block, status: 'active' }, new Date('2026-06-15T10:00:00.000Z').getTime())
    ).toBe(false)
  })
})
