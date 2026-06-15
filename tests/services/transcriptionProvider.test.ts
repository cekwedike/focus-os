import { describe, expect, it, vi } from 'vitest'
import { callOpenRouterTranscription } from '../../src/main/ai/transcriptionProvider'

describe('callOpenRouterTranscription', () => {
  it('returns transcribed text from OpenRouter', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ text: 'hello world' }),
      }))
    )

    const result = await callOpenRouterTranscription({
      apiKey: 'test-key',
      audioBase64: 'abc123',
      format: 'webm',
    })

    expect(result.text).toBe('hello world')
    expect(result.model).toBe('openai/whisper-large-v3-turbo')
  })
})
