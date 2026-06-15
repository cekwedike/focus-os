import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ChatAssistantMessagePayload } from '@shared/types/ipc'
import { useAssistantDelivery } from '@renderer/chat/hooks/useAssistantDelivery'
import { useChatOrchestrator } from '@renderer/chat/hooks/useChatOrchestrator'
import { useChatSession } from '@renderer/chat/hooks/useChatSession'
import type { AssistantDeliveryInput } from '@shared/chat/assistantDelivery'
import { isGreetingSentThisSession } from '@shared/chat/proactiveGreetingSession'

interface ChatContextValue {
  messages: ReturnType<typeof useChatSession>['messages']
  sendMessage: (text: string) => Promise<void>
  sending: boolean
  initialized: boolean
  isTyping: boolean
  greetingComplete: boolean
  deliverAssistantMessages: (messages: AssistantDeliveryInput[]) => Promise<void>
  setGreetingComplete: (complete: boolean) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { messages, appendAssistantMessage, appendUserMessage } = useChatSession()
  const { isTyping, deliverAssistantMessage, deliverAssistantMessages } =
    useAssistantDelivery(appendAssistantMessage)
  const [sending, setSending] = useState(false)
  const [greetingComplete, setGreetingComplete] = useState(() => isGreetingSentThisSession())
  const { processMessage, initialized } = useChatOrchestrator({
    deliverAssistantMessage,
  })

  useEffect(() => {
    const unsubscribe = window.focusOS.onAssistantMessage((payload: ChatAssistantMessagePayload) => {
      void deliverAssistantMessage({
        content: payload.text,
        quickReplies: payload.quickReplies,
      })
    })
    return unsubscribe
  }, [deliverAssistantMessage])

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim()
      if (!trimmed || sending || isTyping) {
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
    [appendUserMessage, processMessage, sending, isTyping]
  )

  const value = useMemo(
    () => ({
      messages,
      sendMessage,
      sending,
      initialized,
      isTyping,
      greetingComplete,
      deliverAssistantMessages,
      setGreetingComplete,
    }),
    [
      messages,
      sendMessage,
      sending,
      initialized,
      isTyping,
      greetingComplete,
      deliverAssistantMessages,
    ]
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
