/** Minimum confidence for deterministic intent execution; below this routes to AI fallback. */
export const AI_CONFIDENCE_THRESHOLD = 0.7

export const CHAT_AI_PER_MODEL_TIMEOUT_MS = 12_000
export const CHAT_AI_CHAIN_TIMEOUT_MS = 45_000
export const CHAT_AI_MAX_OPENROUTER_ATTEMPTS = 4
export const CHAT_AI_MAX_TOTAL_ATTEMPTS = 5

export const DEFAULT_OPENROUTER_FREE_MODELS: string[] = [
  'google/gemma-2-9b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
]
