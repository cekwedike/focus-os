import { useCallback, useState } from 'react'
import {
  getAssistantAttachments,
  getAssistantContent,
  getAssistantDeliveryMode,
  getAssistantNotificationId,
  getAssistantQuickReplies,
  type AssistantDeliveryInput,
} from '@shared/chat/assistantDelivery'
import {
  GREETING_MESSAGE_GAP_MS,
  getTypingDelayMs,
  sleep,
} from '@shared/chat/typingDelay'
import type { AppendAssistantOptions } from './useChatSession'

export function useAssistantDelivery(
  appendAssistantMessage: (content: string, options?: AppendAssistantOptions) => void
) {
  const [isTyping, setIsTyping] = useState(false)

  const deliverAssistantMessage = useCallback(
    async (input: AssistantDeliveryInput): Promise<void> => {
      const deliveryMode = getAssistantDeliveryMode(input)

      if (deliveryMode === 'instant') {
        setIsTyping(true)
        await sleep(getTypingDelayMs())
        setIsTyping(false)
      }

      appendAssistantMessage(getAssistantContent(input), {
        quickReplies: getAssistantQuickReplies(input),
        notificationId: getAssistantNotificationId(input),
        attachments: getAssistantAttachments(input),
      })
    },
    [appendAssistantMessage]
  )

  const deliverAssistantMessages = useCallback(
    async (inputs: AssistantDeliveryInput[]): Promise<void> => {
      for (let index = 0; index < inputs.length; index += 1) {
        if (index > 0) {
          await sleep(GREETING_MESSAGE_GAP_MS)
        }
        await deliverAssistantMessage(inputs[index])
      }
    },
    [deliverAssistantMessage]
  )

  return {
    isTyping,
    deliverAssistantMessage,
    deliverAssistantMessages,
  }
}
