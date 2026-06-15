import type { ChatMessage } from '@shared/types/chat'

interface ChatMessageBubbleProps {
  message: ChatMessage
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps): React.JSX.Element {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  const alignment = isUser ? 'justify-end' : 'justify-start'
  const bubbleClass = isUser
    ? 'bg-accent-mint/15 text-text-primary border-accent-mint/30'
    : isSystem
      ? 'bg-surface-elevated/40 text-text-muted border-surface-border/60'
      : 'bg-surface-card text-text-secondary border-surface-border'

  return (
    <div className={`flex ${alignment}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-panel border px-4 py-3 text-sm leading-relaxed shadow-panel ${bubbleClass}`}
      >
        {!isUser && !isSystem && (
          <p className="focus-kicker mb-1">Assistant</p>
        )}
        {message.content}
      </div>
    </div>
  )
}
