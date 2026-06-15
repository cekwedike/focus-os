import type { ChatIntentType, ChatScreenLink } from '@shared/types/chat'
import type { QuickAddParseResult } from '@shared/parsing/quickAddTask'

export interface ConversationState {
  pendingPrompt: 'wake_time' | null
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
}

export interface WakeTimeExtracted {
  wakeTime: string
}

export interface AddTaskExtracted {
  parseResult: QuickAddParseResult
  ambiguousClients?: string[]
}

export interface BlockActionExtracted {
  blockId: number
  title: string
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

export type IntentExtracted =
  | WakeTimeExtracted
  | AddTaskExtracted
  | BlockActionExtracted
  | LongBreakExtracted
  | FaithLogExtracted
  | Record<string, never>

export interface IntentMatch {
  intent: ChatIntentType
  extracted?: IntentExtracted
  ambiguousMessage?: string
  requiresIpc: boolean
}

export const CHAT_SCREEN_LINKS: ChatScreenLink[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/daily-workspace', label: 'Daily Workspace' },
  { path: '/task-matrix', label: 'Task Matrix' },
  { path: '/schedule', label: 'Schedule' },
  { path: '/daily-insight', label: 'Daily Insight' },
  { path: '/journal', label: 'Journal' },
  { path: '/review', label: 'Review' },
  { path: '/settings', label: 'Settings' },
]

export function createDefaultConversationState(): ConversationState {
  return {
    pendingPrompt: null,
    longBreakActive: false,
    activeFaithBlockId: null,
  }
}
