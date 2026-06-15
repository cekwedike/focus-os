export function formatOpenRouterHttpError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } }
    const message = parsed.error?.message?.trim()
    if (message) {
      if (status === 402 || message.toLowerCase().includes('insufficient credits')) {
        return 'OpenRouter account has no credits. Add credits at openrouter.ai/settings/credits, or configure Ollama for local AI.'
      }

      if (status === 429 || message.toLowerCase().includes('rate-limited')) {
        return 'OpenRouter model is temporarily rate-limited. Try again shortly or choose a different model in Settings.'
      }

      return message
    }
  } catch {
    // Fall through to generic message.
  }

  return `OpenRouter HTTP ${status}: ${body.slice(0, 240)}`
}
