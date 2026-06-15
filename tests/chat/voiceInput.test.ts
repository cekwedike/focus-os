import { describe, expect, it } from 'vitest'
import { mergeVoiceTranscript } from '../../src/shared/chat/voiceTranscript'

describe('mergeVoiceTranscript', () => {
  it('uses transcript when draft is empty', () => {
    expect(mergeVoiceTranscript('', 'hello world', true)).toBe('hello world')
  })

  it('appends final transcript to existing draft', () => {
    expect(mergeVoiceTranscript('wake time', '9am', true)).toBe('wake time 9am')
  })

  it('merges interim transcript', () => {
    expect(mergeVoiceTranscript('add task', 'buy milk', false)).toBe('add task buy milk')
  })
})
