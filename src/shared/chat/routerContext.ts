import type { ChatIntentType, ChatScreenLink } from '@shared/types/chat'
import type { QuickAddParseResult } from '@shared/parsing/quickAddTask'

export interface ConversationState {
  pendingPrompt: 'wake_time' | 'task_priority' | null
  pendingTaskDraft: QuickAddParseResult | null
  longBreakActive: boolean
  activeFaithBlockId: number | null
}

export interface RouterBlockSummary {
  id: number
  title: string
  status: string
  block_type: string
  protected_subtype: string | null
  planned_start?: string
  planned_end?: string
}

export interface RouterContext {
  today: string
  conversation: ConversationState
  clients: Array<{ id: number; name: string }>
  todayBlocks: RouterBlockSummary[]
  activeBlockId: number | null
  unassignedClientId: number
  defaultSleepTime: string
  defaultCapacityMinutes: number
  defaultBufferPercent: number
  nowIso: string
  dueCheckInClients: Array<{ id: number; name: string }>
  openTasks?: Array<{ id: number; title: string }>
}

export interface WakeTimeExtracted {
  wakeTime: string
}

export interface AddTaskExtracted {
  parseResult: QuickAddParseResult
  ambiguousClients?: string[]
}

export interface ConfirmTaskPriorityExtracted {
  draft: QuickAddParseResult
  isUrgent: boolean | null
  isImportant: boolean | null
  skipPriority: boolean
}

export interface BlockActionExtracted {
  blockId: number
  title: string
  early?: boolean
}

export interface LongBreakExtracted {
  reason: string
  plannedMinutes: number | null
}

export interface FaithLogExtracted {
  bibleReference?: string
  prayerNotes?: string
  blockId?: number
}

export interface AcknowledgeCheckInExtracted {
  clientId: number
  clientName: string
}

export interface CompleteTaskExtracted {
  taskId: number
  title: string
}

export interface DeleteTaskExtracted {
  taskId: number
  title: string
}

export interface UpdateTaskExtracted {
  taskId: number
  title: string
  previousTitle: string
}

export type IntentExtracted =
  | WakeTimeExtracted
  | AddTaskExtracted
  | ConfirmTaskPriorityExtracted
  | BlockActionExtracted
  | LongBreakExtracted
  | FaithLogExtracted
  | AcknowledgeCheckInExtracted
  | CompleteTaskExtracted
  | DeleteTaskExtracted
  | UpdateTaskExtracted
  | Record<string, never>

export interface IntentMatch {
  intent: ChatIntentType
  extracted?: IntentExtracted
  ambiguousMessage?: string
  requiresIpc: boolean
  /** Optional match strength; below 0.7 routes to AI fallback. */
  confidence?: number
}

export const CHAT_SCREEN_LINKS: ChatScreenLink[] = [
  { path: '/', label: 'Dashboard' },
  { path: '/task-matrix', label: 'Task Matrix' },
  { path: '/daily-insight', label: 'Daily Insight' },
  { path: '/journal', label: 'Journal' },
  { path: '/review', label: 'Review' },
  { path: '/settings', label: 'Settings' },
]

export function createDefaultConversationState(): ConversationState {
  return {
    pendingPrompt: null,
    pendingTaskDraft: null,
    longBreakActive: false,
    activeFaithBlockId: null,
  }
}
