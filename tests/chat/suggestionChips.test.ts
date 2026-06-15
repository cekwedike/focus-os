import { describe, expect, it } from 'vitest'
import { getSuggestionChips, resolveSuggestionChipState } from '../../src/shared/chat/suggestionChips'

describe('suggestionChips', () => {
  it('returns empty chips while typing or before greeting completes', () => {
    expect(
      getSuggestionChips({
        state: resolveSuggestionChipState({
          wakeTimeLogged: false,
          hasSchedule: false,
          longBreakActive: false,
          isTyping: true,
          greetingComplete: false,
        }),
        isTyping: true,
        greetingComplete: false,
      })
    ).toEqual([])
  })

  it('returns wake shortcuts when awaiting wake time', () => {
    const chips = getSuggestionChips({
      state: 'awaiting_wake',
      isTyping: false,
      greetingComplete: true,
    })
    expect(chips.map((chip) => chip.sendText)).toEqual(['Just woke up', '9am', '9:30'])
  })

  it('returns day-ready chips after schedule exists', () => {
    const chips = getSuggestionChips({
      state: 'day_ready',
      isTyping: false,
      greetingComplete: true,
    })
    expect(chips[0].sendText).toBe("What's next?")
  })

  it('returns long break chips when break is active', () => {
    const state = resolveSuggestionChipState({
      wakeTimeLogged: true,
      hasSchedule: true,
      longBreakActive: true,
      isTyping: false,
      greetingComplete: true,
    })
    expect(state).toBe('long_break')
  })
})
