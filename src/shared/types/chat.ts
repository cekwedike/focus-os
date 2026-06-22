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

export interface ExternalSummaryCardAttachment {
  type: 'external_summary_card'
  nextEventTitle: string | null
  nextEventStart: string | null
  actionableEmailCount: number
  upcomingEventsToday: number
  conflictCount: number
}

export interface SuggestedTaskItem {
  emailId: number
  title: string
  fromAddress: string
  clientName: string | null
  summary: string
}

export interface SuggestedTasksCardAttachment {
  type: 'suggested_tasks_card'
  tasks: SuggestedTaskItem[]
}

export interface ProposedActionItem {
  id: string
  label: string
  sendText: string
  description?: string
}

export interface ProposedActionsCardAttachment {
  type: 'proposed_actions_card'
  title: string
  actions: ProposedActionItem[]
}

export interface MeetingSlotsCardAttachment {
  type: 'meeting_slots_card'
  durationMinutes: number
  scheduleDate: string
  slots: Array<{ startAt: string; endAt: string; reason: string }>
}

export interface NowPlayingCardAttachment {
  type: 'now_playing_card'
  blockId: number
  title: string
  plannedStart: string
  plannedEnd: string
}

export interface CountdownCardAttachment {
  type: 'countdown_card'
  blockId: number
  title: string
  secondsUntil: number
}

export interface DayTimelineCardAttachment {
  type: 'day_timeline_card'
  blocks: ScheduleCardBlock[]
}

export type ChatAttachment =
  | ScheduleCardAttachment
  | TaskSummaryCardAttachment
  | FaithStreakCardAttachment
  | FocusScoreCardAttachment
  | PlannedVsActualCardAttachment
  | ExternalSummaryCardAttachment
  | SuggestedTasksCardAttachment
  | ProposedActionsCardAttachment
  | MeetingSlotsCardAttachment
  | NowPlayingCardAttachment
  | CountdownCardAttachment
  | DayTimelineCardAttachment

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
  | 'find_meeting_slot'
  | 'triage_inbox'
  | 'accept_email_task'
  | 'confirm_morning_plan'
  | 'snooze_block'
  | 'pause_auto_start'
  | 'unrecognized'

export interface ChatScreenLink {
  path: string
  label: string
}
