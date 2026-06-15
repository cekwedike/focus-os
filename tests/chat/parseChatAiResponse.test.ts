import { describe, expect, it } from 'vitest'
import { parseChatAiResponse } from '../../src/shared/chat/parseChatAiResponse'

describe('parseChatAiResponse', () => {
  it('parses execute mode JSON', () => {
    const result = parseChatAiResponse(
      JSON.stringify({
        mode: 'execute',
        intent: 'query_schedule',
        extracted: {},
        replyText: 'Here is your day.',
      })
    )

    expect(result?.mode).toBe('execute')
    if (result?.mode === 'execute') {
      expect(result.intent).toBe('query_schedule')
      expect(result.replyText).toBe('Here is your day.')
    }
  })

  it('parses conversational mode with attachment hint', () => {
    const result = parseChatAiResponse(
      JSON.stringify({
        mode: 'conversational',
        replyText: 'Your streak is strong.',
        suggestedAttachment: 'faith_streak_card',
      })
    )

    expect(result).toEqual({
      mode: 'conversational',
      replyText: 'Your streak is strong.',
      suggestedAttachment: 'faith_streak_card',
    })
  })

  it('parses unavailable mode', () => {
    expect(parseChatAiResponse(JSON.stringify({ mode: 'unavailable' }))).toEqual({
      mode: 'unavailable',
    })
  })

  it('rejects invalid JSON', () => {
    expect(parseChatAiResponse('not json')).toBeNull()
  })

  it('strips markdown fences', () => {
    const result = parseChatAiResponse('```json\n{"mode":"unavailable"}\n```')
    expect(result).toEqual({ mode: 'unavailable' })
  })
})
