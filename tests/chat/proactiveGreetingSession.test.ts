import { describe, expect, it } from 'vitest'
import {
  GREETING_SENT_SESSION_KEY,
  isGreetingSentThisSession,
  markGreetingSentThisSession,
  shouldSendProactiveGreeting,
} from '../../src/shared/chat/proactiveGreetingSession'

describe('proactiveGreetingSession', () => {
  it('should send when session flag is false', () => {
    expect(shouldSendProactiveGreeting(false)).toBe(true)
    expect(shouldSendProactiveGreeting(true)).toBe(false)
  })

  it('tracks greeting sent in sessionStorage', () => {
    const storage = new Map<string, string>()
    const original = globalThis.sessionStorage

    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value)
        },
        removeItem: (key: string) => {
          storage.delete(key)
        },
      },
    })

    try {
      expect(isGreetingSentThisSession()).toBe(false)
      markGreetingSentThisSession()
      expect(storage.get(GREETING_SENT_SESSION_KEY)).toBe('true')
      expect(isGreetingSentThisSession()).toBe(true)
      expect(shouldSendProactiveGreeting(isGreetingSentThisSession())).toBe(false)
    } finally {
      Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: original,
      })
    }
  })
})
