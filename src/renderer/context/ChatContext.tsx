import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useChatOrchestrator } from '@renderer/chat/hooks/useChatOrchestrator'
import { useChatSession } from '@renderer/chat/hooks/useChatSession'

interface ChatContextValue {
  messages: ReturnType<typeof useChatSession>['messages']
  sendMessage: (text: string) => Promise<void>
  sending: boolean
  initialized: boolean
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { messages, appendAssistantMessage, appendUserMessage } = useChatSession()
  const wakePromptSent = useRef(false)
  const [sending, setSending] = useState(false)

  const { processMessage, promptWakeTimeIfNeeded, initialized, pendingWakePrompt } =
    useChatOrchestrator({
      appendAssistantMessage,
      onWakePromptNeeded: () => {
        wakePromptSent.current = false
      },
    })

  useEffect(() => {
    if (initialized && pendingWakePrompt && !wakePromptSent.current && messages.length === 0) {
      wakePromptSent.current = true
      promptWakeTimeIfNeeded()
    }
  }, [initialized, pendingWakePrompt, messages.length, promptWakeTimeIfNeeded])

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim()
      if (!trimmed || sending) {
        return
      }
      appendUserMessage(trimmed)
      setSending(true)
      try {
        await processMessage(trimmed)
      } finally {
        setSending(false)
      }
    },
    [appendUserMessage, processMessage, sending]
  )

  const value = useMemo(
    () => ({
      messages,
      sendMessage,
      sending,
      initialized,
    }),
    [messages, sendMessage, sending, initialized]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider')
  }
  return context
}
