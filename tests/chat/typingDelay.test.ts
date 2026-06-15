import { describe, expect, it } from 'vitest'
import {
  TYPING_DELAY_MAX_MS,
  TYPING_DELAY_MIN_MS,
  getTypingDelayMs,
} from '../../src/shared/chat/typingDelay'

describe('getTypingDelayMs', () => {
  it('returns values within the configured range', () => {
    for (let index = 0; index < 50; index += 1) {
      const delay = getTypingDelayMs()
      expect(delay).toBeGreaterThanOrEqual(TYPING_DELAY_MIN_MS)
      expect(delay).toBeLessThanOrEqual(TYPING_DELAY_MAX_MS)
    }
  })
})
