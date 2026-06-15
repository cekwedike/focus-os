import type { QuickReplyChip } from '@shared/types/chat'

interface ChatMessageInput {
  content: string
  quickReplies?: QuickReplyChip[]
  notificationId?: number
}

export type AssistantDeliveryInput = string | ChatMessageInput

function normalizeInput(input: AssistantDeliveryInput): ChatMessageInput {
  if (typeof input === 'string') {
    return { content: input }
  }

  return input
}

export function getAssistantContent(input: AssistantDeliveryInput): string {
  return normalizeInput(input).content
}

export function getAssistantQuickReplies(
  input: AssistantDeliveryInput
): QuickReplyChip[] | undefined {
  return normalizeInput(input).quickReplies
}

export function getAssistantNotificationId(input: AssistantDeliveryInput): number | undefined {
  return normalizeInput(input).notificationId
}
