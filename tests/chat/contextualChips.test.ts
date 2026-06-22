import { describe, expect, it } from 'vitest'
import { resolveContextualChips } from '../../src/shared/chat/contextualChips'

describe('resolveContextualChips', () => {
  it('returns welcome chips for skippable active blocks', () => {
    const chips = resolveContextualChips('welcome_active_skippable')
    expect(chips.map((chip) => chip.label)).toEqual(['Extend +5', "I'm Done", 'Skip'])
  })

  it('returns pre-completion warning chips', () => {
    const chips = resolveContextualChips('pre_completion_warning')
    expect(chips.map((chip) => chip.sendText)).toContain("I'm done early")
  })

  it('returns auto progression chips', () => {
    const chips = resolveContextualChips('auto_progression')
    expect(chips.map((chip) => chip.sendText)).toContain("What's next?")
  })

  it('returns awaiting wake chips', () => {
    const chips = resolveContextualChips('awaiting_wake')
    expect(chips).toHaveLength(4)
  })
})
