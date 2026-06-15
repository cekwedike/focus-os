export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatAttachment =
  | { type: 'text'; body: string }

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
  attachments?: ChatAttachment[]
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
  | 'unrecognized'

export interface ChatScreenLink {
  path: string
  label: string
}
