import { CHAT_SCREEN_LINKS, type IntentMatch } from '../routerContext'

export function matchMenuIntent(input: string): IntentMatch | null {
  const trimmed = input.trim().toLowerCase()
  if (trimmed === '/menu') {
    return { intent: 'menu', requiresIpc: false }
  }

  if (/\b(list|show)\s+(screens|modules|menu)\b/i.test(input)) {
    return { intent: 'menu', requiresIpc: false }
  }

  return null
}

export { CHAT_SCREEN_LINKS }
