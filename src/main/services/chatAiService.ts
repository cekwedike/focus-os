import {
  CHAT_AI_CHAIN_TIMEOUT_MS,
  CHAT_AI_MAX_OPENROUTER_ATTEMPTS,
  CHAT_AI_MAX_TOTAL_ATTEMPTS,
  CHAT_AI_PER_MODEL_TIMEOUT_MS,
  DEFAULT_OPENROUTER_FREE_MODELS,
} from '@shared/constants/chatAi'
import { parseChatAiResponse } from '@shared/chat/parseChatAiResponse'
import { validateAiExecuteResponse } from '@shared/chat/validateAiIntent'
import type {
  ChatAiFallbackPayload,
  ChatAiFallbackResult,
  ChatAiParsedResponse,
} from '@shared/types/chatAi'
import type { InsightSource } from '@shared/types/insights'
import type { AppSettings } from '@shared/types/settings'
import type { RouterContext } from '@shared/chat/routerContext'
import { CHAT_AI_SYSTEM_PROMPT, buildChatAiUserPrompt } from '../ai/chatAiPromptTemplate'
import { callOllamaChat, callOpenRouterChat } from '../ai/chatProvider'
import { getOpenRouterApiKeyForMainProcess, isOpenRouterKeyConfigured } from './secretsService'

function isTransientError(error: unknown): boolean {
  const message = String(error).toLowerCase()
  return (
    message.includes('abort') ||
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('econnrefused') ||
    message.includes('timeout')
  )
}

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (!isTransientError(error)) {
      throw error
    }
    return operation()
  }
}

function resolveFreeModels(settings: AppSettings): string[] {
  const models = settings.openrouterFreeModels.filter((model) => model.trim().length > 0)
  return models.length > 0 ? models : DEFAULT_OPENROUTER_FREE_MODELS
}

function intentToAction(intent: string | null): string {
  if (!intent) {
    return 'none'
  }

  const actionMap: Record<string, string> = {
    wake_time: 'daily:upsert+schedule:generate+schedule:commit',
    add_task: 'tasks:create',
    start_block: 'schedule:start-block',
    complete_block: 'schedule:complete-and-advance',
    extend_block: 'schedule:extend-block',
    skip_block: 'schedule:skip-block',
    long_break: 'breaks:create',
    end_break: 'breaks:update+schedule:reallocate',
    faith_log: 'journal:upsert',
    query_schedule: 'schedule:get-day',
    query_streak: 'journal:stats',
    query_status: 'review:get-summary',
    query_tasks: 'tasks:list',
    complete_task: 'tasks:update',
    acknowledge_check_in: 'check-ins:acknowledge',
  }

  return actionMap[intent] ?? 'none'
}

export interface ChatAiServiceInput {
  payload: ChatAiFallbackPayload
  settings: AppSettings
  snapshotJson: string
  routerContext: RouterContext
}

export async function resolveChatAiFallback(
  input: ChatAiServiceInput
): Promise<Omit<ChatAiFallbackResult, 'logId'>> {
  const startedAt = Date.now()
  const chainDeadline = startedAt + CHAT_AI_CHAIN_TIMEOUT_MS
  let lastError: string | null = null
  let attempts = 0

  const userPrompt = buildChatAiUserPrompt(
    input.payload.userMessage,
    input.snapshotJson,
    input.payload.routerContextSummary
  )

  const providerOptions = {
    systemPrompt: CHAT_AI_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 600,
  }

  const tryParse = (content: string): ChatAiParsedResponse | null => {
    const parsed = parseChatAiResponse(content)
    if (!parsed) {
      return null
    }

    if (parsed.mode === 'execute') {
      return validateAiExecuteResponse(parsed, input.routerContext)
    }

    return parsed
  }

  const freeModels = resolveFreeModels(input.settings).slice(0, CHAT_AI_MAX_OPENROUTER_ATTEMPTS)

  if (isOpenRouterKeyConfigured()) {
    const apiKey = getOpenRouterApiKeyForMainProcess()
    if (apiKey) {
      for (const model of freeModels) {
        if (attempts >= CHAT_AI_MAX_TOTAL_ATTEMPTS || Date.now() >= chainDeadline) {
          break
        }

        attempts += 1
        const remainingMs = Math.min(
          CHAT_AI_PER_MODEL_TIMEOUT_MS,
          chainDeadline - Date.now()
        )

        if (remainingMs <= 0) {
          break
        }

        try {
          const result = await withRetry(() =>
            callOpenRouterChat(apiKey, model, providerOptions, remainingMs)
          )
          const parsed = tryParse(result.content)

          if (parsed) {
            return {
              response: parsed,
              source: 'openrouter' as InsightSource,
              model: result.model,
              generationMs: Date.now() - startedAt,
              errorMessage: null,
            }
          }

          lastError = 'OpenRouter returned unparseable JSON'
        } catch (error) {
          lastError = String(error)
        }
      }
    }
  }

  if (
    attempts < CHAT_AI_MAX_TOTAL_ATTEMPTS &&
    Date.now() < chainDeadline &&
    input.settings.ollamaEndpoint.trim() &&
    input.settings.ollamaModel.trim()
  ) {
    attempts += 1
    const remainingMs = Math.min(
      CHAT_AI_PER_MODEL_TIMEOUT_MS,
      chainDeadline - Date.now()
    )

    if (remainingMs > 0) {
      try {
        const result = await withRetry(() =>
          callOllamaChat(
            input.settings.ollamaEndpoint,
            input.settings.ollamaModel,
            providerOptions,
            remainingMs
          )
        )
        const parsed = tryParse(result.content)

        if (parsed) {
          return {
            response: parsed,
            source: 'ollama' as InsightSource,
            model: result.model,
            generationMs: Date.now() - startedAt,
            errorMessage: lastError,
          }
        }

        lastError = lastError
          ? `${lastError}; Ollama returned unparseable JSON`
          : 'Ollama returned unparseable JSON'
      } catch (error) {
        lastError = lastError ? `${lastError}; ${String(error)}` : String(error)
      }
    }
  }

  return {
    response: { mode: 'unavailable' },
    source: 'none',
    model: null,
    generationMs: Date.now() - startedAt,
    errorMessage: lastError ?? 'All AI providers failed or returned invalid responses',
  }
}

export function resolveActionTaken(response: ChatAiParsedResponse): string {
  if (response.mode === 'execute') {
    return intentToAction(response.intent)
  }

  if (response.mode === 'conversational') {
    return 'none'
  }

  return 'none'
}

export function resolveClassifiedIntent(response: ChatAiParsedResponse): string | null {
  if (response.mode === 'execute') {
    return response.intent
  }

  return null
}
