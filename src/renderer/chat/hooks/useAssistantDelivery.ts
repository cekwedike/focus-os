import { useCallback, useState } from 'react'
import {
  GREETING_MESSAGE_GAP_MS,
  getTypingDelayMs,
  sleep,
} from '@shared/chat/typingDelay'

export function useAssistantDelivery(
  appendAssistantMessage: (content: string) => void
) {
  const [isTyping, setIsTyping] = useState(false)

  const deliverAssistantMessage = useCallback(
    async (content: string): Promise<void> => {
      setIsTyping(true)
      await sleep(getTypingDelayMs())
      setIsTyping(false)
      appendAssistantMessage(content)
    },
    [appendAssistantMessage]
  )

  const deliverAssistantMessages = useCallback(
    async (contents: string[]): Promise<void> => {
      for (let index = 0; index < contents.length; index += 1) {
        if (index > 0) {
          await sleep(GREETING_MESSAGE_GAP_MS)
        }
        await deliverAssistantMessage(contents[index])
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
