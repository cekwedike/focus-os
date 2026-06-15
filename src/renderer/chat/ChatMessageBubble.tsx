import type { ChatMessage } from '@shared/types/chat'
import { InlineQuickReplies } from './InlineQuickReplies'

interface ChatMessageBubbleProps {
  message: ChatMessage
  onQuickReply?: (text: string) => void
  quickRepliesDisabled?: boolean
}

export function ChatMessageBubble({
  message,
  onQuickReply,
  quickRepliesDisabled = false,
}: ChatMessageBubbleProps): React.JSX.Element {
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
      <div className="flex max-w-[min(100%,32rem)] flex-col gap-2 sm:max-w-[85%]">
        <div
          className={`whitespace-pre-wrap break-words rounded-panel border px-3 py-2.5 text-sm leading-relaxed shadow-panel sm:px-4 sm:py-3 ${bubbleClass}`}
        >
          {!isUser && !isSystem && <p className="focus-kicker mb-1">Assistant</p>}
          {message.content}
        </div>
        {!isUser && message.quickReplies && message.quickReplies.length > 0 && onQuickReply ? (
          <InlineQuickReplies
            chips={message.quickReplies}
            disabled={quickRepliesDisabled}
            onSelect={onQuickReply}
          />
        ) : null}
      </div>
    </div>
  )
}
