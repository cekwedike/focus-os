import { describe, expect, it } from 'vitest'
import { computeActualIntervalMinutes } from '../../src/main/db/repositories/checkInsRepository'

describe('computeActualIntervalMinutes', () => {
  it('returns null for the first check-in of the day', () => {
    expect(
      computeActualIntervalMinutes('2026-06-14T13:00:00.000Z', null)
    ).toBeNull()
  })

  it('computes minutes since the previous acknowledgment', () => {
    expect(
      computeActualIntervalMinutes(
        '2026-06-14T14:10:00.000Z',
        '2026-06-14T13:00:00.000Z'
      )
    ).toBe(70)
  })
})
