import type { IntentMatch } from './routerContext'
import { AI_CONFIDENCE_THRESHOLD } from '@shared/constants/chatAi'

export function shouldTriggerAiFallback(match: IntentMatch): boolean {
  if (match.intent === 'menu') {
    return false
  }

  if (match.ambiguousMessage) {
    return false
  }

  if (match.intent === 'unrecognized') {
    return true
  }

  if (match.confidence !== undefined && match.confidence < AI_CONFIDENCE_THRESHOLD) {
    return true
  }

  return false
}
