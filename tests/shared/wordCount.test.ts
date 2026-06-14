import { describe, expect, it } from 'vitest'
import { countWords } from '../../src/shared/utils/wordCount'

describe('countWords', () => {
  it('returns zero for empty or whitespace text', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   ')).toBe(0)
    expect(countWords(null)).toBe(0)
  })

  it('counts words split on whitespace', () => {
    expect(countWords('Thank you Lord')).toBe(3)
    expect(countWords('  One   two\tthree  ')).toBe(3)
  })
})
