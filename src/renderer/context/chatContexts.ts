import { createContext } from 'react'
import type { useChatSession } from '@renderer/chat/hooks/useChatSession'
import type { AssistantDeliveryInput } from '@shared/chat/assistantDelivery'
import type { QuickReplyChip } from '@shared/types/chat'

export interface ChatContextValue {
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

export interface ChatInternalsValue extends ChatContextValue {
  deliverNotificationToChat: (input: {
    content: string
    quickReplies?: QuickReplyChip[]
    notificationId?: number
  }) => Promise<void>
  resolveNotificationMessage: (notificationId: number) => void
}

export const ChatContext = createContext<ChatContextValue | null>(null)
export const ChatInternalsContext = createContext<ChatInternalsValue | null>(null)
