import { motion } from 'framer-motion'
import type { ChatMessage } from '@shared/types/chat'
import { ChatMessageBubble } from './ChatMessageBubble'

interface AnimatedChatMessageBubbleProps {
  message: ChatMessage
  onQuickReply?: (text: string) => void
  quickRepliesDisabled?: boolean
}

export function AnimatedChatMessageBubble({
  message,
  onQuickReply,
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
        onQuickReply={onQuickReply}
        quickRepliesDisabled={quickRepliesDisabled}
      />
    </motion.div>
  )
}
