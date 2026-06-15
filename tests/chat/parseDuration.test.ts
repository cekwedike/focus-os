import { describe, expect, it } from 'vitest'
import { parseDurationMinutes } from '../../src/shared/chat/parsers/parseDuration'

describe('parseDurationMinutes', () => {
  it('parses minute variants', () => {
    expect(parseDurationMinutes('30 min')).toBe(30)
    expect(parseDurationMinutes('30 minutes')).toBe(30)
  })

  it('parses hour variants', () => {
    expect(parseDurationMinutes('1h')).toBe(60)
    expect(parseDurationMinutes('2 hours')).toBe(120)
  })

  it('parses half an hour', () => {
    expect(parseDurationMinutes('half an hour')).toBe(30)
    expect(parseDurationMinutes('half hour')).toBe(30)
  })

  it('parses bare minutes in back-in context', () => {
    expect(parseDurationMinutes('45')).toBe(45)
  })
})
