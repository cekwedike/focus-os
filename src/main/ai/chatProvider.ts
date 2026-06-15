import { formatOpenRouterHttpError } from './openRouterErrors'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export interface ChatProviderCallOptions {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
}

export interface ChatProviderCallResult {
  content: string
  model: string
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
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

export async function callOpenRouterChat(
  apiKey: string,
  model: string,
  options: ChatProviderCallOptions,
  timeoutMs: number
): Promise<ChatProviderCallResult> {
  const response = await fetchWithTimeout(
    OPENROUTER_URL,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://focus-os.local',
        'X-Title': 'Focus OS',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: options.userPrompt },
        ],
        max_tokens: options.maxTokens ?? 600,
        temperature: 0.2,
      }),
    },
    timeoutMs
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(formatOpenRouterHttpError(response.status, body))
  }

  const payload = (await response.json()) as unknown
  return {
    content: extractOpenRouterContent(payload),
    model,
  }
}

export async function callOllamaChat(
  endpoint: string,
  model: string,
  options: ChatProviderCallOptions,
  timeoutMs: number
): Promise<ChatProviderCallResult> {
  const baseUrl = endpoint.replace(/\/+$/, '')
  const response = await fetchWithTimeout(
    `${baseUrl}/api/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: options.userPrompt },
        ],
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: options.maxTokens ?? 600,
        },
      }),
    },
    timeoutMs
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Ollama HTTP ${response.status}: ${body}`)
  }

  const payload = (await response.json()) as unknown
  return {
    content: extractOllamaContent(payload),
    model,
  }
}
