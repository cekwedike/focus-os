import { motion } from 'framer-motion'
import type { ChatMessage } from '@shared/types/chat'
import type { QuickReplyChip } from '@shared/types/chat'
import { ChatMessageBubble } from './ChatMessageBubble'

interface AnimatedChatMessageBubbleProps {
  message: ChatMessage
  onQuickReply?: (message: ChatMessage, chip: QuickReplyChip) => void
  onSendText?: (text: string) => void
  onAcceptEmailTask?: (emailId: number) => void
  quickRepliesDisabled?: boolean
}

export function AnimatedChatMessageBubble({
  message,
  onQuickReply,
  onSendText,
  onAcceptEmailTask,
  quickRepliesDisabled = false,
}: AnimatedChatMessageBubbleProps): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <ChatMessageBubble
        message={message}
        onQuickReply={
          onQuickReply ? (chip) => onQuickReply(message, chip) : undefined
        }
        onSendText={onSendText}
        onAcceptEmailTask={onAcceptEmailTask}
        quickRepliesDisabled={quickRepliesDisabled}
      />
    </motion.div>
  )
}
