import { useCallback, useEffect, useState } from 'react'
import { useChatContext } from '@renderer/context/useChatContext'
import { useChatInputPlaceholder } from './hooks/useChatInputPlaceholder'
import { useVoiceInput } from './hooks/useVoiceInput'
import { mergeVoiceTranscript } from '@shared/chat/voiceTranscript'
import { useVoiceOutput } from './hooks/useVoiceOutput'

export function ChatInputBar(): React.JSX.Element {
  const { sendMessage, sending, isTyping, aiThinking, messages } = useChatContext()
  const placeholder = useChatInputPlaceholder()
  const [draft, setDraft] = useState('')
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(false)
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

  const { status, statusMessage, isListening, isTranscribing, toggleListening } = useVoiceInput({
    enabled: voiceInputEnabled,
    onTranscript: handleTranscript,
  })

  const handleSubmit = (): void => {
    if (!draft.trim() || sending || isTyping || aiThinking) {
      return
    }
    void sendMessage(draft).then(() => setDraft(''))
  }

  const busy = sending || isTyping || aiThinking
  const micDisabled =
    !voiceInputEnabled ||
    status === 'unsupported' ||
    status === 'denied' ||
    status === 'unavailable' ||
    isTranscribing ||
    busy

  return (
    <div className="shrink-0 border-t border-surface-border/80 bg-surface-base px-3 py-3 sm:px-4 sm:py-4">
      <div className="mx-auto flex w-full max-w-2xl items-end gap-2">
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
            rows={1}
            placeholder={placeholder}
            className="focus-input max-h-32 min-h-[44px] resize-none rounded-2xl border-surface-border bg-surface-card py-3 pl-4 pr-11 text-sm"
            disabled={busy}
          />
          {voiceInputEnabled ? (
            <button
              type="button"
              onClick={() => toggleListening()}
              disabled={micDisabled}
              title={statusMessage ?? 'Voice input'}
              aria-label={statusMessage ?? 'Voice input'}
              className={`absolute bottom-2.5 right-2.5 rounded-full p-1.5 ${
                isListening || isTranscribing
                  ? 'text-accent-mint'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
                <path strokeLinecap="round" d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3z" />
                <path strokeLinecap="round" d="M19 11a7 7 0 01-14 0M12 19v3" />
              </svg>
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy || !draft.trim()}
          className="focus-btn-primary !h-11 !min-w-[4.5rem] shrink-0 rounded-2xl !px-4 disabled:opacity-40"
        >
          {sending ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
