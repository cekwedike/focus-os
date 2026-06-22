import { useCallback } from 'react'
import { useEffect, useRef } from 'react'
import { useChatContext } from '@renderer/context/useChatContext'
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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-4 sm:py-5">
      {!initialized && (
        <p className="py-8 text-center text-sm text-text-muted animate-pulse">One moment…</p>
      )}
      {initialized && messages.length === 0 && !isTyping && !aiThinking ? (
        <p className="py-12 text-center text-sm text-text-muted">
          Your assistant will check in here throughout the day.
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:gap-4">
        {messages.map((message) => (
          <AnimatedChatMessageBubble
            key={message.id}
            message={message}
            onQuickReply={(msg, chip) => void handleQuickReply(msg, chip)}
            onSendText={(text) => void sendMessage(text)}
            onAcceptEmailTask={(emailId) => void sendMessage(`accept email task ${emailId}`)}
            quickRepliesDisabled={sending || isTyping || aiThinking}
          />
        ))}
        {aiThinking ? <AiThinkingIndicator /> : isTyping ? <TypingIndicator /> : null}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
