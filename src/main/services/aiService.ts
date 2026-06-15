import { formatRawSnapshot } from '@shared/insights/formatRawSnapshot'
import type {
  AiProviderTestStatus,
  DailyInsightSnapshot,
  InsightGenerationResult,
  InsightSource,
  TestAiProvidersResponse,
} from '@shared/types/insights'
import type { AppSettings } from '@shared/types/settings'
import { resolveOpenRouterModel } from '@shared/config/openRouterConfig'
import { callOllama } from '../ai/ollamaProvider'
import { callOpenRouter } from '../ai/openRouterProvider'
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

function canUseOpenRouter(settings: AppSettings): boolean {
  return isOpenRouterKeyConfigured() && Boolean(resolveOpenRouterModel(settings))
}

function canUseOllama(settings: AppSettings): boolean {
  return Boolean(settings.ollamaEndpoint.trim()) && Boolean(settings.ollamaModel.trim())
}

export async function generateInsightContent(
  snapshot: DailyInsightSnapshot,
  settings: AppSettings
): Promise<InsightGenerationResult> {
  const startedAt = Date.now()
  const snapshotJson = JSON.stringify(snapshot)
  let lastError: string | null = null

  if (canUseOpenRouter(settings)) {
    const apiKey = getOpenRouterApiKeyForMainProcess()
    if (apiKey) {
      try {
        const result = await withRetry(() =>
          callOpenRouter({
            apiKey,
            model: resolveOpenRouterModel(settings),
            snapshotJson,
          })
        )

        return {
          source: 'openrouter',
          model: result.model,
          contentMarkdown: result.content,
          generationMs: Date.now() - startedAt,
          errorMessage: null,
          snapshot,
        }
      } catch (error) {
        lastError = String(error)
      }
    }
  }

  if (canUseOllama(settings)) {
    try {
      const result = await withRetry(() =>
        callOllama({
          endpoint: settings.ollamaEndpoint,
          model: settings.ollamaModel,
          snapshotJson,
        })
      )

      return {
        source: 'ollama',
        model: result.model,
        contentMarkdown: result.content,
        generationMs: Date.now() - startedAt,
        errorMessage: lastError,
        snapshot,
      }
    } catch (error) {
      lastError = lastError ? `${lastError}; ${String(error)}` : String(error)
    }
  }

  return {
    source: 'none',
    model: null,
    contentMarkdown: formatRawSnapshot(snapshot),
    generationMs: Date.now() - startedAt,
    errorMessage: lastError ?? 'No AI provider configured or available',
    snapshot,
  }
}

async function testProvider(
  source: InsightSource,
  settings: AppSettings
): Promise<{ status: AiProviderTestStatus; message?: string }> {
  if (source === 'openrouter') {
    if (!canUseOpenRouter(settings)) {
      return { status: 'skipped', message: 'OpenRouter key or model not configured' }
    }

    const apiKey = getOpenRouterApiKeyForMainProcess()
    if (!apiKey) {
      return { status: 'skipped', message: 'OpenRouter key not configured' }
    }

    try {
      await callOpenRouter({
        apiKey,
        model: resolveOpenRouterModel(settings),
        snapshotJson: '{}',
        testMode: true,
      })
      return { status: 'ok' }
    } catch (error) {
      return { status: 'failed', message: String(error) }
    }
  }

  if (!canUseOllama(settings)) {
    return { status: 'skipped', message: 'Ollama endpoint or model not configured' }
  }

  try {
    await callOllama({
      endpoint: settings.ollamaEndpoint,
      model: settings.ollamaModel,
      snapshotJson: '{}',
      testMode: true,
    })
    return { status: 'ok' }
  } catch (error) {
    return { status: 'failed', message: String(error) }
  }
}

export async function testAiProviders(settings: AppSettings): Promise<TestAiProvidersResponse> {
  const openrouter = await testProvider('openrouter', settings)
  const ollama = await testProvider('ollama', settings)

  return {
    openrouter: openrouter.status,
    ollama: ollama.status,
    openrouterMessage: openrouter.message,
    ollamaMessage: ollama.message,
  }
}
