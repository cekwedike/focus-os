import type { IntentMatch } from '../routerContext'

export function matchQueryScheduleIntent(input: string): IntentMatch | null {
  const trimmed = input.trim().toLowerCase()

  if (/\bwhat('s| is)\s+next\b/.test(trimmed)) {
    return { intent: 'query_schedule', requiresIpc: true }
  }

  if (/\bshow\s+(my\s+)?schedule\b/.test(trimmed)) {
    return { intent: 'query_schedule', requiresIpc: true }
  }

  if (/\bwhat('s| does)\s+(today|my day)\s+look like\b/.test(trimmed)) {
    return { intent: 'query_schedule', requiresIpc: true }
  }

  return null
}

export function matchQueryStreakIntent(input: string): IntentMatch | null {
  const trimmed = input.trim().toLowerCase()

  if (/\b(faith\s+)?streak\b/.test(trimmed)) {
    return { intent: 'query_streak', requiresIpc: true }
  }

  if (/\bhow am i doing\b.*\bstreak\b/.test(trimmed)) {
    return { intent: 'query_streak', requiresIpc: true }
  }

  return null
}
