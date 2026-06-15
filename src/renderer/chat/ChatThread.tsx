import { useCallback } from 'react'
import { useEffect, useRef } from 'react'
import { useChatContext } from '@renderer/context/ChatContext'
import { useNotifications } from '@renderer/context/NotificationContext'
import type { ChatMessage } from '@shared/types/chat'
import type { QuickReplyChip } from '@shared/types/chat'
import { AnimatedChatMessageBubble } from './AnimatedChatMessageBubble'
import { AiThinkingIndicator } from './AiThinkingIndicator'
import { TypingIndicator } from './TypingIndicator'

export function ChatThread(): React.JSX.Element {
  const { messages, initialized, isTyping, aiThinking, sendMessage, sending } = useChatContext()
  const { performAction } = useNotifications()
  const bottomRef = useRef<HTMLDivElement>(null)

  const handleQuickReply = useCallback(
    async (message: ChatMessage, chip: QuickReplyChip): Promise<void> => {
      if (chip.actionId && message.notificationId) {
        await performAction(message.notificationId, chip.actionId)
        return
      }

      if (chip.sendText) {
        await sendMessage(chip.sendText)
      }
    },
    [performAction, sendMessage]
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, aiThinking])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-8">
      {!initialized && <p className="text-sm text-text-muted">Starting assistant...</p>}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        {messages.map((message) => (
          <AnimatedChatMessageBubble
            key={message.id}
            message={message}
            onQuickReply={(msg, chip) => void handleQuickReply(msg, chip)}
            quickRepliesDisabled={sending || isTyping || aiThinking}
          />
        ))}
        {aiThinking ? <AiThinkingIndicator /> : isTyping ? <TypingIndicator /> : null}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
