export type ChatRole = 'user' | 'assistant' | 'system'

export interface QuickReplyChip {
  label: string
  sendText: string
}

export type ChatAttachment =
  | { type: 'text'; body: string }

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
  attachments?: ChatAttachment[]
  quickReplies?: QuickReplyChip[]
}

export type ChatIntentType =
  | 'menu'
  | 'wake_time'
  | 'add_task'
  | 'start_block'
  | 'complete_block'
  | 'long_break'
  | 'end_break'
  | 'faith_log'
  | 'query_schedule'
  | 'query_streak'
  | 'acknowledge_check_in'
  | 'extend_block'
  | 'skip_block'
  | 'unrecognized'

export interface ChatScreenLink {
  path: string
  label: string
}
