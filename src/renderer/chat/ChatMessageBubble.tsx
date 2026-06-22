import type { ChatMessage } from '@shared/types/chat'
import type { QuickReplyChip } from '@shared/types/chat'
import { InlineQuickReplies } from './InlineQuickReplies'
import { ChatAttachmentRenderer } from './attachments/ChatAttachmentRenderer'
import { motion } from 'framer-motion'

interface ChatMessageBubbleProps {
  message: ChatMessage
  onQuickReply?: (chip: QuickReplyChip) => void
  onSendText?: (text: string) => void
  onAcceptEmailTask?: (emailId: number) => void
  quickRepliesDisabled?: boolean
}

export function ChatMessageBubble({
  message,
  onQuickReply,
  onSendText,
  onAcceptEmailTask,
  quickRepliesDisabled = false,
}: ChatMessageBubbleProps): React.JSX.Element {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const chipsDisabled =
    quickRepliesDisabled || message.notificationResolved === true

  const alignment = isUser ? 'justify-end' : 'justify-start'
  const bubbleClass = isUser
    ? 'bg-accent-mint/15 text-text-primary border-accent-mint/30'
    : isSystem
      ? 'bg-surface-elevated/40 text-text-muted border-surface-border/60'
      : 'bg-surface-card text-text-secondary border-surface-border'

  return (
    <div className={`flex ${alignment}`}>
      <div className="flex max-w-[min(100%,32rem)] flex-col gap-1.5 sm:max-w-[85%]">
        <div
          className={`whitespace-pre-wrap break-words rounded-panel border px-3 py-2.5 text-sm leading-relaxed shadow-panel sm:px-4 sm:py-3 ${bubbleClass}`}
        >
          {!isUser && !isSystem && <p className="focus-kicker mb-1">Assistant</p>}
          {message.content}
          {message.attachments?.map((attachment, index) => (
            <motion.div
              key={`${message.id}-attachment-${index}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <ChatAttachmentRenderer
                attachment={attachment}
                onSendText={onSendText}
                onAcceptEmailTask={onAcceptEmailTask}
              />
            </motion.div>
          ))}
        </div>
        {!isUser && message.quickReplies && message.quickReplies.length > 0 && onQuickReply ? (
          <div className="ml-1 border-l-2 border-accent-mint/25 pl-3">
            <InlineQuickReplies
              chips={message.quickReplies}
              disabled={chipsDisabled}
              onSelect={onQuickReply}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
