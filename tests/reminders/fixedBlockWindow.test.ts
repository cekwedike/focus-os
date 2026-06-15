import { describe, expect, it } from 'vitest'
import {
  isWithinWindow,
  resolveFixedBlockWindow,
} from '../../src/shared/reminders/fixedBlockWindow'

describe('fixedBlockWindow', () => {
  it('detects when now is inside a same-day window', () => {
    const window = resolveFixedBlockWindow('2026-06-14', '09:00', 120)
    const now = new Date('2026-06-14T10:30:00')
    expect(isWithinWindow(now, window)).toBe(true)
  })

  it('detects when now is outside a same-day window', () => {
    const window = resolveFixedBlockWindow('2026-06-14', '09:00', 120)
    const now = new Date('2026-06-14T12:30:00')
    expect(isWithinWindow(now, window)).toBe(false)
  })

  it('supports midnight-spanning windows such as noon to midnight', () => {
    const window = resolveFixedBlockWindow('2026-06-14', '12:00', 720)
    expect(window.windowEnd.getDate()).toBe(15)

    expect(isWithinWindow(new Date('2026-06-14T18:00:00'), window)).toBe(true)
    expect(isWithinWindow(new Date('2026-06-14T23:30:00'), window)).toBe(true)
    expect(isWithinWindow(new Date('2026-06-15T00:00:00'), window)).toBe(false)
    expect(isWithinWindow(new Date('2026-06-14T11:30:00'), window)).toBe(false)
  })
})
