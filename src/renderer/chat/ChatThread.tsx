import { useEffect, useRef } from 'react'
import { useChatContext } from '@renderer/context/ChatContext'
import { AnimatedChatMessageBubble } from './AnimatedChatMessageBubble'
import { TypingIndicator } from './TypingIndicator'

export function ChatThread(): React.JSX.Element {
  const { messages, initialized, isTyping, sendMessage, sending } = useChatContext()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-8">
      {!initialized && <p className="text-sm text-text-muted">Starting assistant...</p>}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        {messages.map((message) => (
          <AnimatedChatMessageBubble
            key={message.id}
            message={message}
            onQuickReply={(text) => void sendMessage(text)}
            quickRepliesDisabled={sending || isTyping}
          />
        ))}
        {isTyping ? <TypingIndicator /> : null}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
