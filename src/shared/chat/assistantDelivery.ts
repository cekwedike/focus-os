import type { QuickReplyChip, ChatAttachment } from '@shared/types/chat'

export type AssistantDeliveryMode = 'instant' | 'ai'

interface ChatMessageInput {
  content: string
  quickReplies?: QuickReplyChip[]
  notificationId?: number
  attachments?: ChatAttachment[]
  deliveryMode?: AssistantDeliveryMode
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

export function getAssistantAttachments(
  input: AssistantDeliveryInput
): ChatAttachment[] | undefined {
  return normalizeInput(input).attachments
}

export function getAssistantDeliveryMode(
  input: AssistantDeliveryInput
): AssistantDeliveryMode {
  return normalizeInput(input).deliveryMode ?? 'instant'
}
