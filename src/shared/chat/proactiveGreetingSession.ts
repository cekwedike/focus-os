export const GREETING_SENT_SESSION_KEY = 'focus-os-greeting-sent-v1'

export function isGreetingSentThisSession(): boolean {
  try {
    return sessionStorage.getItem(GREETING_SENT_SESSION_KEY) === 'true'
  } catch {
    return false
  }
}

export function markGreetingSentThisSession(): void {
  try {
    sessionStorage.setItem(GREETING_SENT_SESSION_KEY, 'true')
  } catch {
    // sessionStorage may be unavailable
  }
}

export function shouldSendProactiveGreeting(sessionFlagSent: boolean): boolean {
  return !sessionFlagSent
}
