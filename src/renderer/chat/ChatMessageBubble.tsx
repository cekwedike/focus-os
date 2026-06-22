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

function AssistantAvatar(): React.JSX.Element {
  return (
    <div
      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-mint/15 text-xs font-semibold text-accent-mint"
      aria-hidden
    >
      F
    </div>
  )
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

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[min(100%,28rem)] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-accent-mint px-4 py-2.5 text-sm leading-relaxed text-surface-base shadow-sm"
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2.5 sm:gap-3">
      {!isSystem ? <AssistantAvatar /> : null}
      <div className="flex min-w-0 max-w-[min(100%,32rem)] flex-1 flex-col gap-2">
        <div
          className={`whitespace-pre-wrap break-words rounded-2xl rounded-tl-md px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
            isSystem
              ? 'bg-surface-elevated/60 text-text-muted'
              : 'bg-surface-card text-text-primary border border-surface-border/60'
          }`}
        >
          {message.content}
          {message.attachments?.map((attachment, index) => (
            <motion.div
              key={`${message.id}-attachment-${index}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="mt-3"
            >
              <ChatAttachmentRenderer
                attachment={attachment}
                onSendText={onSendText}
                onAcceptEmailTask={onAcceptEmailTask}
              />
            </motion.div>
          ))}
        </div>
        {!isSystem && message.quickReplies && message.quickReplies.length > 0 && onQuickReply ? (
          <InlineQuickReplies
            chips={message.quickReplies}
            disabled={chipsDisabled}
            onSelect={onQuickReply}
          />
        ) : null}
      </div>
    </div>
  )
}
