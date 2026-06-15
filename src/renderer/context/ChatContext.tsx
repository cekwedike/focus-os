import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useAssistantDelivery } from '@renderer/chat/hooks/useAssistantDelivery'
import { useChatOrchestrator } from '@renderer/chat/hooks/useChatOrchestrator'
import { useChatSession } from '@renderer/chat/hooks/useChatSession'
import { isGreetingSentThisSession, clearGreetingSentThisSession } from '@shared/chat/proactiveGreetingSession'
import type { QuickReplyChip } from '@shared/types/chat'
import { ChatContext, ChatInternalsContext } from './chatContexts'

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
