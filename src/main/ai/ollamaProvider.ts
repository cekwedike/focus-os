import { AI_TEST_PROMPT, buildInsightUserPrompt, INSIGHT_SYSTEM_PROMPT } from './promptTemplate'

const REQUEST_TIMEOUT_MS = 30_000

export interface OllamaCallOptions {
  endpoint: string
  model: string
  snapshotJson: string
  testMode?: boolean
}

export interface ProviderCallResult {
  content: string
  model: string
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, '')
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

function extractOllamaContent(payload: unknown): string {
  const data = payload as {
    message?: { content?: string }
    error?: string
  }

  if (data.error) {
    throw new Error(data.error)
  }

  const content = data.message?.content?.trim()
  if (!content) {
    throw new Error('Ollama returned empty content')
  }

  return content
}

export async function callOllama(options: OllamaCallOptions): Promise<ProviderCallResult> {
  const baseUrl = normalizeEndpoint(options.endpoint)
  const userPrompt = options.testMode
    ? AI_TEST_PROMPT
    : buildInsightUserPrompt(options.snapshotJson)

  const response = await fetchWithTimeout(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      messages: [
        { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      options: {
        temperature: 0.4,
        num_predict: options.testMode ? 16 : 800,
      },
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Ollama HTTP ${response.status}: ${body}`)
  }

  const payload = (await response.json()) as unknown
  return {
    content: extractOllamaContent(payload),
    model: options.model,
  }
}
