import type Database from 'better-sqlite3'
import type { ChatAiLogResponseMode } from '@shared/types/chatAi'
import type { InsightSource } from '@shared/types/insights'
import { nowIso } from '@shared/utils/time'

export interface ChatAiLogRow {
  id: number
  user_message: string
  response_mode: ChatAiLogResponseMode
  classified_intent: string | null
  source: InsightSource
  model: string | null
  action_taken: string
  generation_ms: number | null
  error_message: string | null
  created_at: string
}

export interface InsertChatAiLogInput {
  userMessage: string
  responseMode: ChatAiLogResponseMode
  classifiedIntent: string | null
  source: InsightSource
  model: string | null
  actionTaken: string
  generationMs: number | null
  errorMessage: string | null
}

const MAX_USER_MESSAGE_LENGTH = 500

export function insertChatAiLog(db: Database.Database, input: InsertChatAiLogInput): ChatAiLogRow {
  const timestamp = nowIso()
  const userMessage =
    input.userMessage.length > MAX_USER_MESSAGE_LENGTH
      ? input.userMessage.slice(0, MAX_USER_MESSAGE_LENGTH)
      : input.userMessage

  const result = db
    .prepare(
      `
      INSERT INTO chat_ai_log (
        user_message,
        response_mode,
        classified_intent,
        source,
        model,
        action_taken,
        generation_ms,
        error_message,
        created_at
      ) VALUES (
        @user_message,
        @response_mode,
        @classified_intent,
        @source,
        @model,
        @action_taken,
        @generation_ms,
        @error_message,
        @created_at
      )
    `
    )
    .run({
      user_message: userMessage,
      response_mode: input.responseMode,
      classified_intent: input.classifiedIntent,
      source: input.source,
      model: input.model,
      action_taken: input.actionTaken,
      generation_ms: input.generationMs,
      error_message: input.errorMessage,
      created_at: timestamp,
    })

  const row = db
    .prepare('SELECT * FROM chat_ai_log WHERE id = ?')
    .get(result.lastInsertRowid) as ChatAiLogRow | undefined

  if (!row) {
    throw new Error('Failed to insert chat_ai_log row')
  }

  return row
}
