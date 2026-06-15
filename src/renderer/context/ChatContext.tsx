import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAssistantDelivery } from '@renderer/chat/hooks/useAssistantDelivery'
import { useChatOrchestrator } from '@renderer/chat/hooks/useChatOrchestrator'
import { useChatSession } from '@renderer/chat/hooks/useChatSession'
import type { AssistantDeliveryInput } from '@shared/chat/assistantDelivery'
import { isGreetingSentThisSession, clearGreetingSentThisSession } from '@shared/chat/proactiveGreetingSession'
import type { QuickReplyChip } from '@shared/types/chat'

interface ChatContextValue {
  messages: ReturnType<typeof useChatSession>['messages']
  sendMessage: (text: string) => Promise<void>
  sending: boolean
  initialized: boolean
  isTyping: boolean
  aiThinking: boolean
  greetingComplete: boolean
  deliverAssistantMessages: (messages: AssistantDeliveryInput[]) => Promise<void>
  setGreetingComplete: (complete: boolean) => void
  clearChat: () => void
}

interface ChatInternalsValue extends ChatContextValue {
  deliverNotificationToChat: (input: {
    content: string
    quickReplies?: QuickReplyChip[]
    notificationId?: number
  }) => Promise<void>
  resolveNotificationMessage: (notificationId: number) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)
const ChatInternalsContext = createContext<ChatInternalsValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { messages, appendAssistantMessage, appendUserMessage, resolveNotificationMessage, clearMessages } =
    useChatSession()
  const { isTyping, deliverAssistantMessage, deliverAssistantMessages } =
    useAssistantDelivery(appendAssistantMessage)
  const [sending, setSending] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const [greetingComplete, setGreetingComplete] = useState(() => isGreetingSentThisSession())
  const { processMessage, initialized } = useChatOrchestrator({
    deliverAssistantMessage,
    setAiThinking,
  })

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim()
      if (!trimmed || sending || isTyping || aiThinking) {
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
    [appendUserMessage, processMessage, sending, isTyping, aiThinking]
  )

  const deliverNotificationToChat = useCallback(
    async (input: {
      content: string
      quickReplies?: QuickReplyChip[]
      notificationId?: number
    }): Promise<void> => {
      await deliverAssistantMessage({
        content: input.content,
        quickReplies: input.quickReplies,
        notificationId: input.notificationId,
      })
    },
    [deliverAssistantMessage]
  )

  const clearChat = useCallback((): void => {
    clearMessages()
    clearGreetingSentThisSession()
    setGreetingComplete(false)
  }, [clearMessages])

  const publicValue = useMemo(
    () => ({
      messages,
      sendMessage,
      sending,
      initialized,
      isTyping,
      aiThinking,
      greetingComplete,
      deliverAssistantMessages,
      setGreetingComplete,
      clearChat,
    }),
    [
      messages,
      sendMessage,
      sending,
      initialized,
      isTyping,
      aiThinking,
      greetingComplete,
      deliverAssistantMessages,
      clearChat,
    ]
  )

  const internalsValue = useMemo(
    () => ({
      ...publicValue,
      deliverNotificationToChat,
      resolveNotificationMessage,
    }),
    [publicValue, deliverNotificationToChat, resolveNotificationMessage]
  )

  return (
    <ChatInternalsContext.Provider value={internalsValue}>
      <ChatContext.Provider value={publicValue}>{children}</ChatContext.Provider>
    </ChatInternalsContext.Provider>
  )
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider')
  }
  return context
}

export function useChatInternals(): ChatInternalsValue {
  const context = useContext(ChatInternalsContext)
  if (!context) {
    throw new Error('useChatInternals must be used within ChatProvider')
  }
  return context
}
