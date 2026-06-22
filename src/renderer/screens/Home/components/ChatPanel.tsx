import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChatInputBar } from '@renderer/chat/ChatInputBar'
import { ChatThread } from '@renderer/chat/ChatThread'
import { useProactiveGreeting } from '@renderer/chat/hooks/useProactiveGreeting'
import { useChatContext } from '@renderer/context/useChatContext'
import { assistantLexicon } from '@shared/copy/assistantLexicon'
import { DayPanelDrawer } from './DayPanelDrawer'
import { ConfirmDialog } from '@renderer/components/modals/ConfirmDialog'

export function ChatPanel(): React.JSX.Element {
  const navigate = useNavigate()
  const {
    initialized,
    greetingComplete,
    setGreetingComplete,
    deliverAssistantMessages,
    aiThinking,
    isTyping,
    sending,
    messages,
    clearChat,
  } = useChatContext()
  const [dayPanelOpen, setDayPanelOpen] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  const handleClearChat = (): void => {
    if (sending || isTyping || aiThinking) {
      return
    }
    if (messages.length > 0) {
      setClearConfirmOpen(true)
      return
    }
    clearChat()
  }

  const handleConfirmClear = (): void => {
    clearChat()
    setClearConfirmOpen(false)
  }

  useProactiveGreeting({
    initialized,
    greetingComplete,
    setGreetingComplete,
    deliverAssistantMessages,
  })

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-base">
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-surface-border px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg font-semibold text-text-primary sm:text-xl">
            {assistantLexicon.appName}
          </h1>
          <p className="hidden truncate text-xs text-text-muted sm:block">{assistantLexicon.tagline}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="focus-btn-ghost text-xs"
            onClick={() => setDayPanelOpen(true)}
          >
            {assistantLexicon.dayDetails}
          </button>
          <button
            type="button"
            className="focus-btn-ghost text-xs"
            onClick={handleClearChat}
            disabled={sending || isTyping || aiThinking}
            title="Clear conversation"
          >
            {assistantLexicon.clearChat}
          </button>
          <button
            type="button"
            className="focus-btn-ghost !px-2.5 !py-2"
            onClick={() => navigate('/settings')}
            aria-label={assistantLexicon.openSettings}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
              />
            </svg>
          </button>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <ChatThread />
        <ChatInputBar />
      </div>

      <DayPanelDrawer open={dayPanelOpen} onClose={() => setDayPanelOpen(false)} />

      <ConfirmDialog
        open={clearConfirmOpen}
        title="Clear conversation?"
        message="All messages in this thread will be removed. This cannot be undone."
        confirmLabel="Clear conversation"
        cancelLabel="Keep messages"
        tone="danger"
        onConfirm={handleConfirmClear}
        onCancel={() => setClearConfirmOpen(false)}
      />
    </div>
  )
}
