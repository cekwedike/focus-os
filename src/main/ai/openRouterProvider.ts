import { AI_TEST_PROMPT, buildInsightUserPrompt, INSIGHT_SYSTEM_PROMPT } from './promptTemplate'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const REQUEST_TIMEOUT_MS = 30_000

export interface OpenRouterCallOptions {
  apiKey: string
  model: string
  snapshotJson: string
  testMode?: boolean
}

export interface ProviderCallResult {
  content: string
  model: string
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

function extractOpenRouterContent(payload: unknown): string {
  const data = payload as {
    choices?: Array<{ message?: { content?: string } }>
    error?: { message?: string }
  }

  if (data.error?.message) {
    throw new Error(data.error.message)
  }

  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('OpenRouter returned empty content')
  }

  return content
}

export async function callOpenRouter(options: OpenRouterCallOptions): Promise<ProviderCallResult> {
  const userPrompt = options.testMode
    ? AI_TEST_PROMPT
    : buildInsightUserPrompt(options.snapshotJson)

  const response = await fetchWithTimeout(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://focus-os.local',
      'X-Title': 'Focus OS',
    },
    body: JSON.stringify({
      model: options.model,
      messages: [
        { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: options.testMode ? 16 : 800,
      temperature: 0.4,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenRouter HTTP ${response.status}: ${body}`)
  }

  const payload = (await response.json()) as unknown
  return {
    content: extractOpenRouterContent(payload),
    model: options.model,
  }
}
