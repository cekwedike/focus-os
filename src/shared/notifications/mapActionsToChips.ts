import type { NotificationAction } from '@shared/types/notifications'
import type { QuickReplyChip } from '@shared/types/chat'

export function mapNotificationActionsToChips(actions: NotificationAction[]): QuickReplyChip[] {
  return actions.map((action) => ({
    label: action.label,
    actionId: action.id,
    sendText: action.sendText,
  }))
}
