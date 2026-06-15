import { formatOpenRouterHttpError } from './openRouterErrors'

const OPENROUTER_TRANSCRIPTION_URL = 'https://openrouter.ai/api/v1/audio/transcriptions'
const REQUEST_TIMEOUT_MS = 45_000

export const DEFAULT_TRANSCRIPTION_MODEL = 'openai/whisper-large-v3-turbo'

export interface TranscriptionCallOptions {
  apiKey: string
  audioBase64: string
  format: string
  model?: string
  language?: string
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

function extractTranscriptionText(payload: unknown): string {
  const data = payload as {
    text?: string
    error?: { message?: string }
  }

  if (data.error?.message) {
    throw new Error(data.error.message)
  }

  const text = data.text?.trim()
  if (!text) {
    throw new Error('OpenRouter returned empty transcription')
  }

  return text
}

export async function callOpenRouterTranscription(
  options: TranscriptionCallOptions
): Promise<{ text: string; model: string }> {
  const model = options.model?.trim() || DEFAULT_TRANSCRIPTION_MODEL

  const response = await fetchWithTimeout(OPENROUTER_TRANSCRIPTION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://focus-os.local',
      'X-Title': 'Focus OS',
    },
    body: JSON.stringify({
      model,
      input_audio: {
        data: options.audioBase64,
        format: options.format,
      },
      ...(options.language ? { language: options.language } : {}),
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(formatOpenRouterHttpError(response.status, body))
  }

  const payload = (await response.json()) as unknown
  return {
    text: extractTranscriptionText(payload),
    model,
  }
}
