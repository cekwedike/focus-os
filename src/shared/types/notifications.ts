export type NotificationType =
  | 'micro_break'
  | 'check_in_due'
  | 'block_warning'
  | 'block_complete'
  | 'block_skipped'
  | 'faith_reminder'
  | 'staleness_alert'
  | 'generic'

export type NotificationUrgency = 'normal' | 'high'

export interface NotificationAction {
  id: string
  label: string
  sendText?: string
}

export interface NotifyPayload {
  type: NotificationType
  title: string
  message: string
  urgency: NotificationUrgency
  persistent: boolean
  dedupeKey: string
  actions?: NotificationAction[]
  showInChat?: boolean
  metadata?: Record<string, unknown>
}

export interface ActiveNotificationSummary {
  id: number
  type: NotificationType
  title: string
  message: string
  urgency: NotificationUrgency
  persistent: boolean
  dedupeKey: string
  actions: NotificationAction[]
  metadata: Record<string, unknown>
  createdAt: string
}

export interface NotificationDispatchedPayload extends ActiveNotificationSummary {
  showInChat: boolean
  skippedDuplicate: boolean
}

export interface NotificationStateChangedPayload {
  active: ActiveNotificationSummary[]
}

export interface NotificationAcknowledgedPayload {
  notificationId: number
}

export interface NotificationActionPayload {
  notificationId: number
  actionId: string
}

export interface NotificationActionResponse {
  acknowledged: boolean
  sendText?: string
  navigate?: string
}

export interface NotificationListActiveResponse {
  active: ActiveNotificationSummary[]
}
