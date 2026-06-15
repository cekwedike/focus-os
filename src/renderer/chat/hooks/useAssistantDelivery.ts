import { useCallback, useState } from 'react'
import type { QuickReplyChip } from '@shared/types/chat'
import {
  getAssistantContent,
  getAssistantQuickReplies,
  type AssistantDeliveryInput,
} from '@shared/chat/assistantDelivery'
import {
  GREETING_MESSAGE_GAP_MS,
  getTypingDelayMs,
  sleep,
} from '@shared/chat/typingDelay'

export function useAssistantDelivery(
  appendAssistantMessage: (content: string, quickReplies?: QuickReplyChip[]) => void
) {
  const [isTyping, setIsTyping] = useState(false)

  const deliverAssistantMessage = useCallback(
    async (input: AssistantDeliveryInput): Promise<void> => {
      setIsTyping(true)
      await sleep(getTypingDelayMs())
      setIsTyping(false)
      appendAssistantMessage(getAssistantContent(input), getAssistantQuickReplies(input))
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
