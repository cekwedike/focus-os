import { parseWakeTime } from '../parsers/parseWakeTime'
import type { IntentMatch, RouterContext, WakeTimeExtracted } from '../routerContext'

export function matchWakeTimeIntent(input: string, context: RouterContext): IntentMatch | null {
  if (context.conversation.pendingPrompt !== 'wake_time') {
    return null
  }

  const wakeTime = parseWakeTime(input, new Date(context.nowIso))
  if (!wakeTime) {
    return null
  }

  const extracted: WakeTimeExtracted = { wakeTime }
  return { intent: 'wake_time', extracted, requiresIpc: true }
}
