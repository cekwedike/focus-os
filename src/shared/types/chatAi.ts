import type { ChatAttachmentType } from './chat'
import type { ChatIntentType } from './chat'
import type { IntentExtracted } from '../chat/routerContext'
import type { InsightSource } from './insights'

export type ChatAiResponseMode = 'execute' | 'conversational' | 'unavailable'

export type ChatAiLogResponseMode =
  | ChatAiResponseMode
  | 'chain_failed'

export interface ChatAiExecuteResponse {
  mode: 'execute'
  intent: ChatIntentType
  extracted: IntentExtracted
  replyText?: string
}

export interface ChatAiConversationalResponse {
  mode: 'conversational'
  replyText: string
  suggestedAttachment?: ChatAttachmentType
}

export interface ChatAiUnavailableResponse {
  mode: 'unavailable'
}

export type ChatAiParsedResponse =
  | ChatAiExecuteResponse
  | ChatAiConversationalResponse
  | ChatAiUnavailableResponse

export interface ChatAiFallbackPayload {
  userMessage: string
  routerContextSummary: ChatRouterContextSummary
  scheduleDate: string
}

export interface ChatRouterContextSummary {
  today: string
  pendingPrompt: 'wake_time' | 'task_priority' | null
  longBreakActive: boolean
  activeFaithBlockId: number | null
  activeBlockId: number | null
  clients: Array<{ id: number; name: string }>
  todayBlocks: Array<{
    id: number
    title: string
    status: string
    block_type: string
    planned_start?: string
    planned_end?: string
  }>
  dueCheckInClients: Array<{ id: number; name: string }>
}

export interface ChatAiFallbackResult {
  response: ChatAiParsedResponse
  source: InsightSource
  model: string | null
  generationMs: number
  errorMessage: string | null
  logId: number | null
}
