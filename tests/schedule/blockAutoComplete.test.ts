import { describe, expect, it } from 'vitest'
import { isFaithBlock, shouldAutoCompleteBlock } from '../../src/shared/schedule/blockAutoComplete'

const baseBlock = {
  status: 'active',
  block_type: 'protected',
  protected_subtype: null,
  planned_end: '2026-06-15T12:55:00.000Z',
}

describe('shouldAutoCompleteBlock', () => {
  it('auto-completes active blocks after planned end', () => {
    const nowMs = new Date('2026-06-15T12:55:01.000Z').getTime()

    expect(shouldAutoCompleteBlock(baseBlock, nowMs)).toBe(true)
  })

  it('does not auto-complete before planned end', () => {
    const nowMs = new Date('2026-06-15T12:54:59.000Z').getTime()

    expect(shouldAutoCompleteBlock(baseBlock, nowMs)).toBe(false)
  })

  it('does not auto-complete planned blocks', () => {
    const nowMs = new Date('2026-06-15T13:00:00.000Z').getTime()

    expect(shouldAutoCompleteBlock({ ...baseBlock, status: 'planned' }, nowMs)).toBe(false)
  })

  it('does not auto-complete faith blocks', () => {
    const nowMs = new Date('2026-06-15T13:00:00.000Z').getTime()

    expect(
      shouldAutoCompleteBlock(
        {
          ...baseBlock,
          block_type: 'protected',
          protected_subtype: 'faith',
        },
        nowMs
      )
    ).toBe(false)
  })
})

describe('isFaithBlock', () => {
  it('detects faith protected blocks', () => {
    expect(
      isFaithBlock({
        block_type: 'protected',
        protected_subtype: 'faith',
      })
    ).toBe(true)
  })
})
