import type { ChatAttachment } from '@shared/types/chat'

export function buildNotificationAttachments(
  metadata: Record<string, unknown> | undefined
): ChatAttachment[] | undefined {
  if (!metadata) {
    return undefined
  }

  const attachmentType = metadata.attachmentType
  if (attachmentType === 'now_playing_card' && typeof metadata.blockId === 'number') {
    return [
      {
        type: 'now_playing_card',
        blockId: metadata.blockId,
        title: String(metadata.blockTitle ?? ''),
        plannedStart: String(metadata.plannedStart ?? ''),
        plannedEnd: String(metadata.plannedEnd ?? ''),
      },
    ]
  }

  if (attachmentType === 'countdown_card' && typeof metadata.blockId === 'number') {
    return [
      {
        type: 'countdown_card',
        blockId: metadata.blockId,
        title: String(metadata.blockTitle ?? ''),
        secondsUntil: typeof metadata.secondsUntil === 'number' ? metadata.secondsUntil : 60,
      },
    ]
  }

  return undefined
}
