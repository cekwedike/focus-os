export const TYPING_DELAY_MIN_MS = 650
export const TYPING_DELAY_MAX_MS = 1100
export const GREETING_MESSAGE_GAP_MS = 350

export function getTypingDelayMs(): number {
  return TYPING_DELAY_MIN_MS + Math.floor(Math.random() * (TYPING_DELAY_MAX_MS - TYPING_DELAY_MIN_MS + 1))
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
