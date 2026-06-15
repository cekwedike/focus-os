import { useCallback, useEffect, useState } from 'react'
import { useChatContext } from '@renderer/context/ChatContext'
import { useVoiceInput } from './hooks/useVoiceInput'
import { mergeVoiceTranscript } from '@shared/chat/voiceTranscript'
import { useVoiceOutput } from './hooks/useVoiceOutput'

export function ChatInputBar(): React.JSX.Element {
  const { sendMessage, sending, isTyping, aiThinking, messages } = useChatContext()
  const [draft, setDraft] = useState('')
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(true)
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false)

  useEffect(() => {
    void window.focusOS.settings.get().then((response) => {
      setVoiceInputEnabled(response.settings.voiceInputEnabled)
      setVoiceOutputEnabled(response.settings.voiceOutputEnabled)
    })
  }, [])

  const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant')
  useVoiceOutput(voiceOutputEnabled, lastAssistant?.content ?? '', lastAssistant?.role ?? '')

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    setDraft((current) => mergeVoiceTranscript(current, text, isFinal))
  }, [])

  const { status, isListening, toggleListening } = useVoiceInput({
    enabled: voiceInputEnabled,
    onTranscript: handleTranscript,
  })

  const handleSubmit = (): void => {
    if (!draft.trim() || sending || isTyping || aiThinking) {
      return
    }
    void sendMessage(draft).then(() => setDraft(''))
  }

  const micDisabled =
    !voiceInputEnabled || status === 'unsupported' || status === 'denied' || sending || isTyping || aiThinking

  const micTitle =
    status === 'unsupported'
      ? 'Voice input not supported in this environment'
      : status === 'denied'
        ? 'Microphone access denied'
        : isListening
          ? 'Stop listening'
          : 'Start voice input'

  return (
    <div className="shrink-0 border-t border-surface-border bg-surface-card/80 px-3 py-3 backdrop-blur-xl sm:px-4 sm:py-4 md:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 sm:flex-row sm:items-end">
        <div className="relative min-w-0 flex-1">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSubmit()
              }
            }}
            rows={2}
            placeholder="Tell Focus OS what you need..."
            className="focus-input min-h-[48px] resize-none pr-11 sm:min-h-[52px] sm:pr-12"
            disabled={sending || isTyping || aiThinking}
          />
          {voiceInputEnabled ? (
            <button
              type="button"
              onClick={() => toggleListening()}
              disabled={micDisabled}
              title={micTitle}
              aria-label={micTitle}
              className={`absolute bottom-2 right-2 rounded-button p-1.5 sm:bottom-2.5 sm:right-2.5 sm:p-2 ${
                isListening
                  ? 'animate-pulse text-accent-mint'
                  : micDisabled
                    ? 'cursor-not-allowed text-text-muted opacity-50'
                    : 'text-text-secondary hover:text-accent-mint'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0M12 19v3" />
              </svg>
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={sending || isTyping || aiThinking || !draft.trim()}
          className="focus-btn-primary w-full shrink-0 disabled:opacity-50 sm:w-auto sm:self-end"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
