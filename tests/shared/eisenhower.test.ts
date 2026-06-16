import { describe, expect, it } from 'vitest'
import {
  eisenhowerFromQuadrant,
  parseEisenhowerFromText,
  priorityFromEisenhower,
  resolveQuadrant,
} from '../../src/shared/tasks/eisenhower'

describe('eisenhower', () => {
  it('maps quadrants to allocation priority', () => {
    expect(priorityFromEisenhower(eisenhowerFromQuadrant('do_first'))).toBe(1)
    expect(priorityFromEisenhower(eisenhowerFromQuadrant('schedule'))).toBe(2)
    expect(priorityFromEisenhower(eisenhowerFromQuadrant('delegate'))).toBe(3)
    expect(priorityFromEisenhower(eisenhowerFromQuadrant('eliminate'))).toBe(4)
    expect(priorityFromEisenhower({ isUrgent: null, isImportant: null })).toBe(5)
  })

  it('parses quadrant phrases from natural language', () => {
    expect(parseEisenhowerFromText('do first')).toEqual({
      isUrgent: true,
      isImportant: true,
    })
    expect(parseEisenhowerFromText('schedule this')).toEqual({
      isUrgent: false,
      isImportant: true,
    })
    expect(parseEisenhowerFromText('no priority')).toBe('skip')
  })

  it('resolves combined urgent/important keywords', () => {
    const flags = parseEisenhowerFromText('urgent and important')
    expect(resolveQuadrant(flags as { isUrgent: boolean; isImportant: boolean })).toBe('do_first')
  })
})
