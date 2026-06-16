export type ChatRole = 'user' | 'assistant' | 'system'

export interface QuickReplyChip {
  label: string
  sendText?: string
  actionId?: string
}

export interface ScheduleCardBlock {
  id: number
  title: string
  status: string
  block_type: string
  clientColor?: string | null
  planned_start?: string
  planned_end?: string
}

export interface ScheduleCardAttachment {
  type: 'schedule_card'
  blocks: ScheduleCardBlock[]
  highlightBlockId?: number | null
}

export interface TaskSummaryItem {
  id: number
  title: string
  clientName: string
  priority: number
  deadlineDate: string | null
  status: string
}

export interface TaskSummaryCardAttachment {
  type: 'task_summary_card'
  tasks: TaskSummaryItem[]
}

export interface FaithStreakCardAttachment {
  type: 'faith_streak_card'
  currentStreak: number
  longestStreak: number
  todayLogged: boolean
  entriesThisMonth?: number
}

export interface FocusScoreCardAttachment {
  type: 'focus_score_card'
  score: number | null
  completedBlocks: number
  totalWorkBlocks: number
  activeBlockTitle?: string | null
  activeBlockProgressPercent?: number | null
}

export interface PlannedActualRow {
  id: string
  label: string
  plannedMinutes: number
  actualMinutes: number
}

export interface PlannedVsActualCardAttachment {
  type: 'planned_vs_actual_card'
  rows: PlannedActualRow[]
  dateLabel: string
}

export type ChatAttachment =
  | ScheduleCardAttachment
  | TaskSummaryCardAttachment
  | FaithStreakCardAttachment
  | FocusScoreCardAttachment
  | PlannedVsActualCardAttachment

export type ChatAttachmentType = ChatAttachment['type']

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
  attachments?: ChatAttachment[]
  quickReplies?: QuickReplyChip[]
  notificationId?: number
  notificationResolved?: boolean
}

export type ChatIntentType =
  | 'menu'
  | 'wake_time'
  | 'add_task'
  | 'confirm_task_priority'
  | 'start_block'
  | 'complete_block'
  | 'long_break'
  | 'end_break'
  | 'faith_log'
  | 'query_schedule'
  | 'query_streak'
  | 'query_status'
  | 'query_tasks'
  | 'complete_task'
  | 'delete_task'
  | 'update_task'
  | 'replan_day'
  | 'acknowledge_check_in'
  | 'extend_block'
  | 'skip_block'
  | 'unrecognized'

export interface ChatScreenLink {
  path: string
  label: string
}
